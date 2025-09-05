import XCTest
import SwiftData
@testable import vocabDict

final class FetchLookupCountCommandTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testFetchCount() throws {
        context.insert(DictionaryLookupStats(word: "hello", count: 5, firstLookup: Date(), lastLookup: Date()))
        try context.save()
        let req = ProtoFetchLookupCountRequest(action: .fetchLookupCount, word: "hello")
        let resp = try FetchLookupCountCommand.fromProto(req, context: context).execute()
        XCTAssertTrue(resp.success)
        XCTAssertEqual(resp.count, 5)
    }
}

