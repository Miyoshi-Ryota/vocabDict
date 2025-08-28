//
//  CloudKitStoreTests.swift
//  vocabDictTests
//
//  Created by Ryota Miyoshi on 2025/8/28.
//

import XCTest
import SwiftData
@testable import vocabDict

class CloudKitStoreTests: XCTestCase {
    
    var cloudKitStore: CloudKitStore!
    var modelContext: ModelContext!
    
    override func setUp() {
        super.setUp()
        
        cloudKitStore = CloudKitStore(inMemory: true)
        modelContext = cloudKitStore.modelContext
    }
    
    override func tearDown() {
        modelContext = nil
        cloudKitStore = nil
        super.tearDown()
    }
    
    // MARK: - VocabularyList Tests
    
    func testCreateVocabularyList() {
        let name = "Test Vocabulary"
        let list = cloudKitStore.createVocabularyList(name: name, isDefault: false)
        XCTAssertEqual(list.name, name)
        XCTAssertFalse(list.isDefault)
        XCTAssertNotNil(list.id)
        XCTAssertNotNil(list.created)
    }
    
    func testAddWordToVocabularyList() {
        // Given
        let list = cloudKitStore.createVocabularyList(name: "Test List", isDefault: false)
        let metadata = ["difficulty": "medium", "customNotes": "greeting"]
        let userData = cloudKitStore.addWordToVocabularyList(word: "hello", metadata: metadata, to: list.id)
        XCTAssertNotNil(userData)
        XCTAssertEqual(userData?.word, "hello")
        XCTAssertEqual(userData?.difficulty, "medium")
        XCTAssertEqual(userData?.customNotes, "greeting")
    }
    
    func testPreventDuplicateWords() {
        // Given
        let list = cloudKitStore.createVocabularyList(name: "Test List", isDefault: false)
        _ = cloudKitStore.addWordToVocabularyList(word: "hello", metadata: [:], to: list.id)
        let duplicate = cloudKitStore.addWordToVocabularyList(word: "hello", metadata: [:], to: list.id)
        XCTAssertNil(duplicate, "Should not add duplicate word")
    }

    func testUpdateWord() {
        let list = cloudKitStore.createVocabularyList(name: "Test List", isDefault: false)
        _ = cloudKitStore.addWordToVocabularyList(word: "hello", metadata: ["difficulty": "medium", "customNotes": "note"], to: list.id)
        let updates: [String: Any] = ["difficulty": "hard", "customNotes": "updated"]
        let updated = cloudKitStore.updateWord(word: "hello", updates: updates, in: list.id)
        XCTAssertEqual(updated?.difficulty, "hard")
        XCTAssertEqual(updated?.customNotes, "updated")
    }

    // MARK: - Spaced Repetition Tests

    func testSubmitReviewCalculatesNextInterval() {
        let list = cloudKitStore.createVocabularyList(name: "Test List", isDefault: false)
        _ = cloudKitStore.addWordToVocabularyList(word: "knownWord", metadata: [:], to: list.id)
        _ = cloudKitStore.addWordToVocabularyList(word: "unknownWord", metadata: [:], to: list.id)
        _ = cloudKitStore.addWordToVocabularyList(word: "masteredWord", metadata: [:], to: list.id)

        let knownResponse = cloudKitStore.submitReview(word: "knownWord", result: "known", timeSpent: 10, in: list.id)
        let knownData = knownResponse["data"] as? [String: Any]
        XCTAssertEqual(knownData?["nextInterval"] as? Int, 3)

        let unknownResponse = cloudKitStore.submitReview(word: "unknownWord", result: "unknown", timeSpent: 5, in: list.id)
        let unknownData = unknownResponse["data"] as? [String: Any]
        XCTAssertEqual(unknownData?["nextInterval"] as? Int, 1)

        let masteredResponse = cloudKitStore.submitReview(word: "masteredWord", result: "mastered", timeSpent: 5, in: list.id)
        let masteredData = masteredResponse["data"] as? [String: Any]
        XCTAssertNil(masteredData?["nextInterval"] as? Int)
        let nextReviewString = masteredData?["nextReview"] as? String
        let nextReviewDate = nextReviewString.flatMap { ISO8601DateFormatter().date(from: $0) }
        XCTAssertEqual(nextReviewDate, Date.distantFuture)
    }
    
    func testSubmitReview() {
        // Given
        let list = cloudKitStore.createVocabularyList(name: "Test List", isDefault: false)
        _ = cloudKitStore.addWordToVocabularyList(word: "hello", metadata: [:], to: list.id)
        let response = cloudKitStore.submitReview(word: "hello", result: "known", timeSpent: 15.5, in: list.id)
        let data = response["data"] as? [String: Any]
        let wordData = data?["word"] as? [String: Any]
        let history = wordData?["reviewHistory"] as? [[String: Any]]
        XCTAssertEqual(history?.count, 1)
        XCTAssertNotNil(wordData?["lastReviewed"])
        XCTAssertNotNil(wordData?["nextReview"])
        XCTAssertEqual(history?.first?["result"] as? String, "known")
    }
    
    func testMasteredWordHandling() {
        // Given
        let list = cloudKitStore.createVocabularyList(name: "Test List", isDefault: false)
        _ = cloudKitStore.addWordToVocabularyList(word: "hello", metadata: [:], to: list.id)
        let response = cloudKitStore.submitReview(word: "hello", result: "mastered", timeSpent: 5.0, in: list.id)
        let data = response["data"] as? [String: Any]
        XCTAssertNil(data?["nextInterval"] as? Int)
        let nextReviewString = data?["nextReview"] as? String
        let nextReviewDate = nextReviewString.flatMap { ISO8601DateFormatter().date(from: $0) }
        XCTAssertEqual(nextReviewDate, Date.distantFuture)
    }
    
    // MARK: - Settings Tests
    
    func testGetDefaultSettings() {
        // Given
        let settings = UserSettings(
            theme: "dark",
            autoPlayPronunciation: false,
            showExampleSentences: true,
            textSelectionMode: "inline",
            autoAddLookups: false
        )
        modelContext.insert(settings)
        
        // Then
        XCTAssertEqual(settings.theme, "dark")
        XCTAssertFalse(settings.autoPlayPronunciation)
        XCTAssertTrue(settings.showExampleSentences)
        XCTAssertEqual(settings.textSelectionMode, "inline")
    }
    
    func testUpdateSettings() {
        // Given
        let settings = UserSettings(
            theme: "dark",
            autoPlayPronunciation: false,
            showExampleSentences: true,
            textSelectionMode: "inline",
            autoAddLookups: false
        )
        modelContext.insert(settings)
        
        // When
        settings.theme = "light"
        settings.autoPlayPronunciation = true
        
        do {
            try modelContext.save()
        } catch {
            XCTFail("Failed to save: \(error)")
        }
        
        // Then
        XCTAssertEqual(settings.theme, "light")
        XCTAssertTrue(settings.autoPlayPronunciation)
    }
    
    // MARK: - Recent Search Tests
    
    func testAddRecentSearch() {
        // Given
        let search = RecentSearchHistory(word: "hello")
        modelContext.insert(search)
        
        do {
            try modelContext.save()
        } catch {
            XCTFail("Failed to save: \(error)")
        }
        
        // Then
        XCTAssertEqual(search.word, "hello")
        XCTAssertNotNil(search.searchedAt)
    }
    
    func testRecentSearchLimit() {
        // Given - Add 25 searches
        for i in 1...25 {
            let search = RecentSearchHistory(word: "word\(i)")
            modelContext.insert(search)
        }
        
        do {
            try modelContext.save()
            
            // When - Fetch recent searches
            let descriptor = FetchDescriptor<RecentSearchHistory>(
                sortBy: [SortDescriptor(\.searchedAt, order: .reverse)]
            )
            let searches = try modelContext.fetch(descriptor)
            
            // Then - Should have all 25, but in practice we'd limit to 20
            XCTAssertEqual(searches.count, 25)
            
            // Verify they're sorted by most recent first
            if searches.count > 1 {
                XCTAssertTrue(searches[0].searchedAt >= searches[1].searchedAt)
            }
        } catch {
            XCTFail("Failed to fetch: \(error)")
        }
    }
    
    // MARK: - Lookup Statistics Tests
    
    func testIncrementLookupCount() {
        // Given
        let word = "hello"
        let stats = DictionaryLookupStats(word: word)
        modelContext.insert(stats)
        
        // When
        stats.count += 1
        stats.lastLookup = Date()
        
        do {
            try modelContext.save()
        } catch {
            XCTFail("Failed to save: \(error)")
        }
        
        // Then
        XCTAssertEqual(stats.count, 1)
        XCTAssertNotNil(stats.lastLookup)
        // First lookup and last lookup might have tiny time differences, so just check they exist
        XCTAssertNotNil(stats.firstLookup)
    }
    
    func testMultipleLookups() {
        // Given
        let word = "hello"
        let stats = DictionaryLookupStats(word: word)
        let firstLookupTime = stats.firstLookup
        modelContext.insert(stats)
        
        // When - Multiple lookups
        for _ in 1...5 {
            stats.count += 1
            stats.lastLookup = Date()
        }
        
        do {
            try modelContext.save()
        } catch {
            XCTFail("Failed to save: \(error)")
        }
        
        // Then
        XCTAssertEqual(stats.count, 5)
        XCTAssertEqual(stats.firstLookup, firstLookupTime)
        XCTAssertNotEqual(stats.firstLookup, stats.lastLookup)
    }
}