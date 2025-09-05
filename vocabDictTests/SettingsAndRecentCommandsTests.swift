//
//  SettingsAndRecentCommandsTests.swift
//  vocabDictTests
//

import XCTest
import SwiftData
@testable import vocabDict

final class SettingsAndRecentCommandsTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testFetchAndUpdateSettings() throws {
        let fetchReq = ProtoFetchSettingsRequest(action: .fetchSettings)
        let fetchResp = try FetchSettingsCommand.fromProto(fetchReq, context: context).execute()
        XCTAssertTrue(fetchResp.success)

        let update = ProtoSettings(autoAddLookups: true, autoPlayPronunciation: true, showExampleSentences: nil, textSelectionMode: .popup, theme: .light)
        let updateReq = ProtoUpdateSettingsRequest(action: .updateSettings, settings: update)
        let updateResp = try UpdateSettingsCommand.fromProto(updateReq, context: context).execute()
        XCTAssertTrue(updateResp.success)
        XCTAssertEqual(updateResp.settings?.theme, .light)
        XCTAssertEqual(updateResp.settings?.textSelectionMode, .popup)
        XCTAssertEqual(updateResp.settings?.autoPlayPronunciation, true)
        XCTAssertEqual(updateResp.settings?.autoAddLookups, true)
    }

    func testRecentSearches() throws {
        for i in 1...12 {
            let req = ProtoAddRecentSearchRequest(action: .addRecentSearch, word: "w\(i)")
            _ = try AddRecentSearchCommand.fromProto(req, context: context).execute()
        }
        let getReq = ProtoFetchRecentSearchesRequest(action: .fetchRecentSearches, limit: 10)
        let getResp = try FetchRecentSearchesCommand.fromProto(getReq, context: context).execute()
        XCTAssertTrue(getResp.success)
        XCTAssertEqual(getResp.recentSearches?.count, 10)
        // latest first
        XCTAssertEqual(getResp.recentSearches?.first, "w12")
    }
}

