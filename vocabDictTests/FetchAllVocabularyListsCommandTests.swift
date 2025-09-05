//
//  FetchAllVocabularyListsCommandTests.swift
//  vocabDictTests
//
//  Tests for FetchAllVocabularyListsCommand.
//

import XCTest
import SwiftData
@testable import vocabDict

final class FetchAllVocabularyListsCommandTests: XCTestCase {

    var store: CloudKitStore!
    var context: ModelContext!

    override func setUp() {
        super.setUp()
        store = CloudKitStore(inMemory: true)
        context = store.modelContext
    }

    override func tearDown() {
        context = nil
        store = nil
        super.tearDown()
    }

    func testFetchReturnsInsertedLists() throws {
        // Given: two lists
        let listA = VocabularyList(name: "List A", isDefault: true)
        let listB = VocabularyList(name: "List B", isDefault: false)
        context.insert(listA)
        context.insert(listB)
        try context.save()

        // When
        let req = ProtoFetchAllVocabularyListsRequest(action: .fetchAllVocabularyLists)
        let cmd = FetchAllVocabularyListsCommand.fromProto(req, context: context)
        let resp = try cmd.execute()

        // Then
        XCTAssertTrue(resp.success)
        let lists = resp.vocabularyLists ?? []
        XCTAssertEqual(lists.count, 2)
        let ids = Set(lists.map { $0.id })
        XCTAssertTrue(ids.contains(listA.id.uuidString))
        XCTAssertTrue(ids.contains(listB.id.uuidString))
        // Check basic fields
        let fetchedA = lists.first { $0.id == listA.id.uuidString }
        XCTAssertEqual(fetchedA?.name, "List A")
        XCTAssertEqual(fetchedA?.isDefault, true)
    }

    func testWordsMappingIncluded() throws {
        // Given: one list with a word entry
        let now = Date()
        let usd = UserSpecificData(
            word: "hello",
            dateAdded: now,
            difficulty: 7500,
            customNotes: "note",
            lastReviewed: nil,
            nextReview: Date(timeIntervalSinceNow: 3600),
            reviewHistory: []
        )
        let list = VocabularyList(name: "My List", isDefault: true, words: ["hello": usd])
        context.insert(list)
        try context.save()

        // When
        let req = ProtoFetchAllVocabularyListsRequest(action: .fetchAllVocabularyLists)
        let cmd = FetchAllVocabularyListsCommand.fromProto(req, context: context)
        let resp = try cmd.execute()

        // Then
        XCTAssertTrue(resp.success)
        guard let fetched = resp.vocabularyLists?.first(where: { $0.id == list.id.uuidString }) else {
            return XCTFail("List not found in response")
        }
        let words = fetched.words
        XCTAssertNotNil(words["hello"])
        if let entry = words["hello"] {
            XCTAssertEqual(entry.word, "hello")
            XCTAssertEqual(entry.difficulty, 7500)
            XCTAssertEqual(entry.customNotes, "note")
            XCTAssertNil(entry.lastReviewed)
            // dateAdded/nextReview の値そのものの一致は環境差を考慮し、省略（存在のみ確認）
            XCTAssertNotNil(entry.dateAdded)
            XCTAssertNotNil(entry.nextReview)
        }
    }
}

