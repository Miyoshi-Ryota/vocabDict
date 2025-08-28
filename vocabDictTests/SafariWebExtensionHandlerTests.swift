//
//  SafariWebExtensionHandlerTests.swift
//  vocabDictTests
//
//  Created by Ryota Miyoshi on 2025/8/28.
//

import XCTest
import SafariServices
import SwiftData
@testable import vocabDict

class SafariWebExtensionHandlerTests: XCTestCase {
    
    var handler: SafariWebExtensionHandler!
    var mockContext: MockExtensionContext!
    
    override func setUp() {
        super.setUp()
        handler = SafariWebExtensionHandler()
        mockContext = MockExtensionContext()
    }
    
    override func tearDown() {
        handler = nil
        mockContext = nil
        super.tearDown()
    }
    
    // MARK: - Message Routing Tests
    
    func testGetVocabularyListsMessage() {
        // Given
        let message: [String: Any] = ["action": "getVocabularyLists"]
        mockContext.setupInputItem(with: message)
        
        // When
        handler.beginRequest(with: mockContext)
        
        // Then
        XCTAssertNotNil(mockContext.completedItems)
        if let response = mockContext.extractResponse() {
            XCTAssertNotNil(response["vocabularyLists"])
        }
    }
    
    func testCreateVocabularyListMessage() {
        // Given
        let message: [String: Any] = [
            "action": "createVocabularyList",
            "name": "Test List",
            "isDefault": false
        ]
        mockContext.setupInputItem(with: message)
        
        // When
        handler.beginRequest(with: mockContext)
        
        // Then
        XCTAssertNotNil(mockContext.completedItems)
        if let response = mockContext.extractResponse() {
            XCTAssertNotNil(response["vocabularyList"])
            if let list = response["vocabularyList"] as? [String: Any] {
                XCTAssertEqual(list["name"] as? String, "Test List")
            }
        }
    }
    
    func testAddWordToListMessage() {
        // Given - First create a list
        let createMessage: [String: Any] = [
            "action": "createVocabularyList",
            "name": "Test List"
        ]
        mockContext.setupInputItem(with: createMessage)
        handler.beginRequest(with: mockContext)
        
        // Get the list ID from response
        guard let createResponse = mockContext.extractResponse(),
              let list = createResponse["vocabularyList"] as? [String: Any],
              let listId = list["id"] as? String else {
            XCTFail("Failed to create list")
            return
        }
        
        // When - Add word to list
        let addWordMessage: [String: Any] = [
            "action": "addWordToList",
            "listId": listId,
            "word": "hello",
            "metadata": ["difficulty": "easy", "customNotes": "test note"]
        ]
        
        let newContext = MockExtensionContext()
        newContext.setupInputItem(with: addWordMessage)
        handler.beginRequest(with: newContext)
        
        // Then
        XCTAssertNotNil(newContext.completedItems)
        if let response = newContext.extractResponse() {
            XCTAssertTrue(response["success"] as? Bool ?? false)
            XCTAssertNotNil(response["data"])
        }
    }
    
    func testInvalidMessageFormat() {
        // Given - Message without action
        let message: [String: Any] = ["invalid": "data"]
        mockContext.setupInputItem(with: message)
        
        // When
        handler.beginRequest(with: mockContext)
        
        // Then
        XCTAssertNotNil(mockContext.completedItems)
        if let response = mockContext.extractResponse() {
            XCTAssertNotNil(response["error"])
            XCTAssertEqual(response["error"] as? String, "Invalid message format")
        }
    }
    
    func testMissingRequiredParameters() {
        // Given - createVocabularyList without name
        let message: [String: Any] = ["action": "createVocabularyList"]
        mockContext.setupInputItem(with: message)
        
        // When
        handler.beginRequest(with: mockContext)
        
        // Then
        XCTAssertNotNil(mockContext.completedItems)
        if let response = mockContext.extractResponse() {
            XCTAssertNotNil(response["error"])
            XCTAssertEqual(response["error"] as? String, "Name is required")
        }
    }
    
    // MARK: - Review Message Tests
    
    func testSubmitReviewMessage() {
        // Given - Create list and add word first
        let createMessage: [String: Any] = [
            "action": "createVocabularyList",
            "name": "Test List"
        ]
        mockContext.setupInputItem(with: createMessage)
        handler.beginRequest(with: mockContext)
        
        guard let createResponse = mockContext.extractResponse(),
              let list = createResponse["vocabularyList"] as? [String: Any],
              let listId = list["id"] as? String else {
            XCTFail("Failed to create list")
            return
        }
        
        // Add word
        let addWordMessage: [String: Any] = [
            "action": "addWordToList",
            "listId": listId,
            "word": "hello",
            "metadata": [:]
        ]
        
        let addContext = MockExtensionContext()
        addContext.setupInputItem(with: addWordMessage)
        handler.beginRequest(with: addContext)
        
        // When - Submit review
        let reviewMessage: [String: Any] = [
            "action": "submitReview",
            "listId": listId,
            "word": "hello",
            "result": "known",
            "timeSpent": 10.5
        ]
        
        let reviewContext = MockExtensionContext()
        reviewContext.setupInputItem(with: reviewMessage)
        handler.beginRequest(with: reviewContext)
        
        // Then
        XCTAssertNotNil(reviewContext.completedItems)
        if let response = reviewContext.extractResponse() {
            XCTAssertTrue(response["success"] as? Bool ?? false)
            XCTAssertNotNil(response["data"])
            if let data = response["data"] as? [String: Any] {
                XCTAssertNotNil(data["nextReview"])
                XCTAssertNotNil(data["word"])
            }
        }
    }
    
    // MARK: - Settings Tests
    
    func testGetSettingsMessage() {
        // Given
        let message: [String: Any] = ["action": "getSettings"]
        mockContext.setupInputItem(with: message)
        
        // When
        handler.beginRequest(with: mockContext)
        
        // Then
        XCTAssertNotNil(mockContext.completedItems)
        if let response = mockContext.extractResponse() {
            XCTAssertNotNil(response["settings"])
            if let settings = response["settings"] as? [String: Any] {
                XCTAssertNotNil(settings["theme"])
                XCTAssertNotNil(settings["autoPlayPronunciation"])
            }
        }
    }
    
    func testUpdateSettingsMessage() {
        // Given
        let message: [String: Any] = [
            "action": "updateSettings",
            "settings": [
                "theme": "light",
                "autoPlayPronunciation": true
            ]
        ]
        mockContext.setupInputItem(with: message)
        
        // When
        handler.beginRequest(with: mockContext)
        
        // Then
        XCTAssertNotNil(mockContext.completedItems)
        if let response = mockContext.extractResponse() {
            XCTAssertNotNil(response["settings"])
            if let settings = response["settings"] as? [String: Any] {
                XCTAssertEqual(settings["theme"] as? String, "light")
                XCTAssertEqual(settings["autoPlayPronunciation"] as? Bool, true)
            }
        }
    }
    
    // MARK: - Recent Search Tests
    
    func testAddRecentSearchMessage() {
        // Given
        let message: [String: Any] = [
            "action": "addRecentSearch",
            "word": "hello"
        ]
        mockContext.setupInputItem(with: message)
        
        // When
        handler.beginRequest(with: mockContext)
        
        // Then
        XCTAssertNotNil(mockContext.completedItems)
        if let response = mockContext.extractResponse() {
            XCTAssertTrue(response["success"] as? Bool ?? false)
        }
    }
    
    func testGetRecentSearchesMessage() {
        // Given - Add a search first
        let addMessage: [String: Any] = [
            "action": "addRecentSearch",
            "word": "hello"
        ]
        mockContext.setupInputItem(with: addMessage)
        handler.beginRequest(with: mockContext)
        
        // When - Get recent searches
        let getMessage: [String: Any] = ["action": "getRecentSearches"]
        let getContext = MockExtensionContext()
        getContext.setupInputItem(with: getMessage)
        handler.beginRequest(with: getContext)
        
        // Then
        XCTAssertNotNil(getContext.completedItems)
        if let response = getContext.extractResponse() {
            XCTAssertNotNil(response["recentSearches"])
            if let searches = response["recentSearches"] as? [String] {
                XCTAssertTrue(searches.contains("hello"))
            }
        }
    }
    
    // MARK: - Lookup Statistics Tests
    
    func testIncrementLookupCountMessage() {
        // Given
        let message: [String: Any] = [
            "action": "incrementLookupCount",
            "word": "hello"
        ]
        mockContext.setupInputItem(with: message)
        
        // When
        handler.beginRequest(with: mockContext)
        
        // Then
        XCTAssertNotNil(mockContext.completedItems)
        if let response = mockContext.extractResponse() {
            XCTAssertTrue(response["success"] as? Bool ?? false)
        }
    }
    
    func testGetLookupCountMessage() {
        // Given - Increment count first
        let incrementMessage: [String: Any] = [
            "action": "incrementLookupCount",
            "word": "hello"
        ]
        mockContext.setupInputItem(with: incrementMessage)
        handler.beginRequest(with: mockContext)
        
        // When - Get count
        let getMessage: [String: Any] = [
            "action": "getLookupCount",
            "word": "hello"
        ]
        let getContext = MockExtensionContext()
        getContext.setupInputItem(with: getMessage)
        handler.beginRequest(with: getContext)
        
        // Then
        XCTAssertNotNil(getContext.completedItems)
        if let response = getContext.extractResponse() {
            XCTAssertNotNil(response["count"])
            XCTAssertGreaterThanOrEqual(response["count"] as? Int ?? 0, 1)
        }
    }
}

// MARK: - Mock Extension Context

class MockExtensionContext: NSExtensionContext {
    var completedItems: [NSExtensionItem]?
    private var inputItem: NSExtensionItem?
    
    override var inputItems: [Any] {
        return inputItem != nil ? [inputItem!] : []
    }
    
    func setupInputItem(with message: [String: Any]) {
        let item = NSExtensionItem()
        item.userInfo = [SFExtensionMessageKey: message]
        inputItem = item
    }
    
    override func completeRequest(returningItems items: [Any]?, completionHandler: ((Bool) -> Void)? = nil) {
        completedItems = items as? [NSExtensionItem]
        completionHandler?(true)
    }
    
    func extractResponse() -> [String: Any]? {
        guard let items = completedItems,
              let item = items.first,
              let userInfo = item.userInfo,
              let message = userInfo[SFExtensionMessageKey] as? [String: Any] else {
            return nil
        }
        return message
    }
}