import XCTest
import SwiftData
@testable import vocabDict

final class AddRecentSearchCommandTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testAddSingleSearch() throws {
        let req = ProtoAddRecentSearchRequest(action: .addRecentSearch, word: "hello")
        let resp = try AddRecentSearchCommand.fromProto(req, context: context).execute()
        XCTAssertTrue(resp.success)

        let all = try context.fetch(FetchDescriptor<RecentSearchHistory>())
        XCTAssertEqual(all.count, 1)
        XCTAssertEqual(all.first?.word, "hello")
    }
}

