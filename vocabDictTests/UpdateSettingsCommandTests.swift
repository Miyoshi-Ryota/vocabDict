import XCTest
import SwiftData
@testable import vocabDict

final class UpdateSettingsCommandTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testUpdateValues() throws {
        let req = ProtoUpdateSettingsRequest(action: .updateSettings, settings: ProtoSettings(autoAddLookups: true, autoPlayPronunciation: true, showExampleSentences: false, textSelectionMode: .popup, theme: .light))
        let resp = try UpdateSettingsCommand.fromProto(req, context: context).execute()
        XCTAssertTrue(resp.success)
        XCTAssertEqual(resp.settings?.theme, .light)
        XCTAssertEqual(resp.settings?.textSelectionMode, .popup)
        XCTAssertEqual(resp.settings?.autoPlayPronunciation, true)
        XCTAssertEqual(resp.settings?.autoAddLookups, true)
    }
}

