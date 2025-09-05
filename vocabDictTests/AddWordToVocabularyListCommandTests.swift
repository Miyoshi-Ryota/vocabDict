//
//  AddWordToVocabularyListCommandTests.swift
//  vocabDictTests
//

import XCTest
import SwiftData
@testable import vocabDict

final class AddWordToVocabularyListCommandTests: XCTestCase {
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

    private func makeList(name: String = "List") throws -> VocabularyList {
        let list = VocabularyList(name: name, isDefault: false)
        context.insert(list)
        try context.save()
        return list
    }

    func testAddWordSuccess() throws {
        let list = try makeList()
        let meta = ProtoMetadata(customNotes: "note", difficulty: 9000)
        let req = ProtoAddWordToVocabularyListRequest(
            action: .addWordToVocabularyList,
            listID: list.id.uuidString,
            metadata: meta,
            word: "hello"
        )
        let cmd = AddWordToVocabularyListCommand.fromProto(req, context: context)
        let resp = try cmd.execute()

        XCTAssertTrue(resp.success)
        XCTAssertNil(resp.error)
        guard let data = resp.data else { return XCTFail("missing data") }
        XCTAssertEqual(data.word, "hello")
        XCTAssertEqual(data.difficulty, 9000)
        XCTAssertEqual(data.customNotes, "note")
    }

    func testDuplicateWordFails() throws {
        let list = try makeList()
        let meta = ProtoMetadata(customNotes: nil, difficulty: nil)
        let req = ProtoAddWordToVocabularyListRequest(
            action: .addWordToVocabularyList,
            listID: list.id.uuidString,
            metadata: meta,
            word: "hello"
        )
        let cmd = AddWordToVocabularyListCommand.fromProto(req, context: context)
        _ = try cmd.execute()

        // second attempt
        let resp2 = try AddWordToVocabularyListCommand.fromProto(req, context: context).execute()
        XCTAssertFalse(resp2.success)
        XCTAssertNil(resp2.data)
    }

    func testInvalidListID() throws {
        let req = ProtoAddWordToVocabularyListRequest(
            action: .addWordToVocabularyList,
            listID: "invalid-uuid",
            metadata: nil,
            word: "hello"
        )
        let resp = try AddWordToVocabularyListCommand.fromProto(req, context: context).execute()
        XCTAssertFalse(resp.success)
        XCTAssertNotNil(resp.error)
    }
}

