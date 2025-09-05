import XCTest
import SwiftData
@testable import vocabDict

final class FetchSettingsCommandTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testFetchCreatesDefaultIfMissing() throws {
        let req = ProtoFetchSettingsRequest(action: .fetchSettings)
        let resp = try FetchSettingsCommand.fromProto(req, context: context).execute()
        XCTAssertTrue(resp.success)
        XCTAssertNotNil(resp.settings)
    }
}

