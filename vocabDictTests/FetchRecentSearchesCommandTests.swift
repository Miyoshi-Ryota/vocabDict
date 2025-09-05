import XCTest
import SwiftData
@testable import vocabDict

final class FetchRecentSearchesCommandTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testFetchOrderAndLimit() throws {
        for i in 1...12 {
            context.insert(RecentSearchHistory(word: "w\(i)", searchedAt: Date().addingTimeInterval(Double(i))))
        }
        try context.save()
        let req = ProtoFetchRecentSearchesRequest(action: .fetchRecentSearches, limit: 10)
        let resp = try FetchRecentSearchesCommand.fromProto(req, context: context).execute()
        XCTAssertTrue(resp.success)
        XCTAssertEqual(resp.recentSearches?.count, 10)
        XCTAssertEqual(resp.recentSearches?.first, "w12")
    }
}

