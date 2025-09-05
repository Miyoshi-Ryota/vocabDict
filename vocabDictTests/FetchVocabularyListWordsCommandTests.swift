//
//  FetchVocabularyListWordsCommandTests.swift
//  vocabDictTests
//

import XCTest
import SwiftData
@testable import vocabDict

final class FetchVocabularyListWordsCommandTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testReturnsWordsAndStats() throws {
        // list with two words
        let list = VocabularyList(name: "L", isDefault: false)
        list.words["hello"] = UserSpecificData(word: "hello", difficulty: 5000)
        list.words["zeta"] = UserSpecificData(word: "zeta", difficulty: 2000)
        context.insert(list)

        // stats for hello only
        context.insert(DictionaryLookupStats(word: "hello", count: 3, firstLookup: Date(), lastLookup: Date()))
        try context.save()

        let req = ProtoFetchVocabularyListWordsRequest(action: .fetchVocabularyListWords, filterBy: nil, listID: list.id.uuidString, sortBy: .lookupCount, sortOrder: .desc)
        let resp = try FetchVocabularyListWordsCommand.fromProto(req, context: context).execute()
        XCTAssertTrue(resp.success)
        guard let data = resp.data else { return XCTFail("missing data") }
        XCTAssertEqual(data.words?.count, 2)
        XCTAssertEqual(data.lookupStats?["hello"]?.count, 3)
    }
}

