//
//  CreateVocabularyListCommandTests.swift
//  vocabDictTests
//

import XCTest
import SwiftData
@testable import vocabDict

final class CreateVocabularyListCommandTests: XCTestCase {
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

    func testCreateListDefaultsToNonDefault() throws {
        let req = ProtoCreateVocabularyListRequest(action: .createVocabularyList, isDefault: nil, name: "My List")
        let cmd = CreateVocabularyListCommand.fromProto(req, context: context)
        let resp = try cmd.execute()

        XCTAssertTrue(resp.success)
        XCTAssertNil(resp.error)
        guard let list = resp.vocabularyList else { return XCTFail("Missing vocabularyList in response") }
        XCTAssertEqual(list.name, "My List")
        XCTAssertEqual(list.isDefault, false)
        XCTAssertNotNil(list.createdAt)
        XCTAssertTrue(list.words.isEmpty)
    }

    func testCreateListWithIsDefaultTrue() throws {
        let req = ProtoCreateVocabularyListRequest(action: .createVocabularyList, isDefault: true, name: "Default List")
        let cmd = CreateVocabularyListCommand.fromProto(req, context: context)
        let resp = try cmd.execute()

        XCTAssertTrue(resp.success)
        XCTAssertNil(resp.error)
        guard let list = resp.vocabularyList else { return XCTFail("Missing vocabularyList in response") }
        XCTAssertEqual(list.name, "Default List")
        XCTAssertEqual(list.isDefault, true)
    }
}

