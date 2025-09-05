//
//  UpdateWordCommandTests.swift
//  vocabDictTests
//

import XCTest
import SwiftData
@testable import vocabDict

final class UpdateWordCommandTests: XCTestCase {
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

    private func makeListWithWord(name: String = "List", word: String = "hello") throws -> VocabularyList {
        let list = VocabularyList(name: name, isDefault: false)
        list.words[word.lowercased()] = UserSpecificData(word: word, difficulty: 5000, customNotes: "note")
        context.insert(list)
        try context.save()
        return list
    }

    func testUpdateDifficultyAndNotes() throws {
        let list = try makeListWithWord()
        let updates = ProtoUpdates(customNotes: "updated", difficulty: 10000)
        let req = ProtoUpdateWordRequest(action: .updateWord, listID: list.id.uuidString, updates: updates, word: "hello")
        let resp = try UpdateWordCommand.fromProto(req, context: context).execute()

        XCTAssertTrue(resp.success)
        guard let data = resp.data else { return XCTFail("missing data") }
        XCTAssertEqual(data.difficulty, 10000)
        XCTAssertEqual(data.customNotes, "updated")
    }

    func testInvalidListID() throws {
        let updates = ProtoUpdates(customNotes: nil, difficulty: nil)
        let req = ProtoUpdateWordRequest(action: .updateWord, listID: "bad-uuid", updates: updates, word: "hello")
        let resp = try UpdateWordCommand.fromProto(req, context: context).execute()
        XCTAssertFalse(resp.success)
        XCTAssertNotNil(resp.error)
    }

    func testWordNotFound() throws {
        let list = VocabularyList(name: "Empty", isDefault: false)
        context.insert(list)
        try context.save()

        let updates = ProtoUpdates(customNotes: "x", difficulty: 1)
        let req = ProtoUpdateWordRequest(action: .updateWord, listID: list.id.uuidString, updates: updates, word: "nope")
        let resp = try UpdateWordCommand.fromProto(req, context: context).execute()

        XCTAssertFalse(resp.success)
        XCTAssertNotNil(resp.error)
    }
}

