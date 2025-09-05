import XCTest
import SwiftData
@testable import vocabDict

final class FetchLookupStatsCommandTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testFetchStats() throws {
        context.insert(DictionaryLookupStats(word: "hello", count: 2, firstLookup: Date(), lastLookup: Date()))
        context.insert(DictionaryLookupStats(word: "world", count: 1, firstLookup: Date(), lastLookup: Date()))
        try context.save()
        let req = ProtoFetchLookupStatsRequest(action: .fetchLookupStats)
        let resp = try FetchLookupStatsCommand.fromProto(req, context: context).execute()
        XCTAssertTrue(resp.success)
        XCTAssertEqual(resp.stats?["hello"]?.count, 2)
        XCTAssertEqual(resp.stats?["world"]?.count, 1)
    }
}

