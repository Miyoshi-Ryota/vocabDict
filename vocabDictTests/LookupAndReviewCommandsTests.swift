//
//  LookupAndReviewCommandsTests.swift
//  vocabDictTests
//

import XCTest
import SwiftData
@testable import vocabDict

final class LookupAndReviewCommandsTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testIncrementAndFetchLookup() throws {
        let incReq = ProtoIncrementLookupCountRequest(action: .incrementLookupCount, word: "hello")
        _ = try IncrementLookupCountCommand.fromProto(incReq, context: context).execute()
        _ = try IncrementLookupCountCommand.fromProto(incReq, context: context).execute()

        let countReq = ProtoFetchLookupCountRequest(action: .fetchLookupCount, word: "hello")
        let countResp = try FetchLookupCountCommand.fromProto(countReq, context: context).execute()
        XCTAssertEqual(countResp.count, 2)

        let statsReq = ProtoFetchLookupStatsRequest(action: .fetchLookupStats)
        let statsResp = try FetchLookupStatsCommand.fromProto(statsReq, context: context).execute()
        XCTAssertEqual(statsResp.stats?["hello"]?.count, 2)
    }

    func testSubmitReviewFlow() throws {
        // Prepare list and word
        let list = VocabularyList(name: "L", isDefault: false)
        list.words["hello"] = UserSpecificData(word: "hello", difficulty: 5000)
        context.insert(list)
        try context.save()

        // known -> nextInterval 3
        let req = ProtoSubmitReviewRequest(action: .submitReview, listID: list.id.uuidString, reviewResult: .known, timeSpent: 5, word: "hello")
        let resp = try SubmitReviewCommand.fromProto(req, context: context).execute()
        XCTAssertTrue(resp.success)
        XCTAssertEqual(resp.data?.nextInterval, 3)
        XCTAssertNotNil(resp.data?.nextReview)
        XCTAssertEqual(resp.data?.word?.word, "hello")
    }
}

