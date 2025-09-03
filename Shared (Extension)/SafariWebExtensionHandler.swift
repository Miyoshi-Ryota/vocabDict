//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by Ryota Miyoshi on 2025/7/19.
//

import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    let cloudKitStore = CloudKitStore.shared
    
    func beginRequest(with context: NSExtensionContext) {
        os_log(.default, "MIYO DBG SafariWebExtensionHandler beginRequest with context: %@", context)

        let request = context.inputItems.first as? NSExtensionItem
        
        let profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        
        let message: Any? = request?.userInfo?[SFExtensionMessageKey]
        
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")

        guard let messageDict = message as? [String: Any],
              let action = messageDict["action"] as? String else {
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid message format" ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            return
        }
        
        os_log(.default, "Processing action: %@", action)
        
        // Convert dictionary to JSON data for Codable decoding
        let jsonData: Data
        do {
            jsonData = try JSONSerialization.data(withJSONObject: messageDict, options: [])
        } catch {
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Failed to parse message: \(error.localizedDescription)" ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            return
        }
        
        func complete(_ payload: [String: Any]) {
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: payload ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
        }

        func fail(_ message: String) {
            complete([ "success": false, "error": message ])
        }

        // Centralized response validation (Codable round-trip) using generated types as SSOT.
        func validateAndComplete<T: Codable>(_ payload: [String: Any], as: T.Type) {
            do {
                let raw = try JSONSerialization.data(withJSONObject: payload, options: [])
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                // Decode once
                let model = try decoder.decode(T.self, from: raw)

                let encoder = JSONEncoder()
                encoder.dateEncodingStrategy = .iso8601
                // Encode the decoded model
                let encoded = try encoder.encode(model)
                let jsonObject = try JSONSerialization.jsonObject(with: encoded, options: [])
                guard let dict = jsonObject as? [String: Any] else {
                    throw NSError(domain: "ValidateAndComplete", code: -1, userInfo: [NSLocalizedDescriptionKey: "Response encoding produced non-dictionary JSON"])
                }
                complete(dict)
            } catch {
                fail("Encoding response failed: \(error.localizedDescription)")
            }
        }

        switch action {
        case "fetchAllVocabularyLists":
            // Validate request using Codable
            do {
                _ = try JSONDecoder().decode(ProtoFetchAllVocabularyListsRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            let lists = cloudKitStore.getVocabularyLists()
            let listsData = lists.map { $0.toDictionary() }
            validateAndComplete([ "success": true, "vocabularyLists": listsData ], as: ProtoFetchAllVocabularyListsResponse.self)
            
        case "createVocabularyList":
            // Decode and validate request
            let createRequest: ProtoCreateVocabularyListRequest
            do {
                createRequest = try JSONDecoder().decode(ProtoCreateVocabularyListRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let newList = cloudKitStore.createVocabularyList(name: createRequest.name, isDefault: createRequest.isDefault ?? false)
            validateAndComplete([ "success": true, "vocabularyList": newList.toDictionary() ], as: ProtoCreateVocabularyListResponse.self)
            
        case "addWordToVocabularyList":
            // Decode and validate request
            let addWordRequest: ProtoAddWordToVocabularyListRequest
            do {
                addWordRequest = try JSONDecoder().decode(ProtoAddWordToVocabularyListRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            guard let listUUID = UUID(uuidString: addWordRequest.listID) else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid list ID format" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            // Convert metadata to [String: Any] for CloudKitStore
            var metadata: [String: Any] = [:]
            if let difficulty = addWordRequest.metadata?.difficulty {
                metadata["difficulty"] = difficulty
            }
            if let customNotes = addWordRequest.metadata?.customNotes {
                metadata["customNotes"] = customNotes
            }
            
            // Add word to list
            if let wordEntry = cloudKitStore.addWordToVocabularyList(word: addWordRequest.word, metadata: metadata, to: listUUID) {
                validateAndComplete([ "success": true, "data": wordEntry.toDictionary() ], as: ProtoAddWordToVocabularyListResponse.self)
            } else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Failed to add word to list" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
            }
            
        case "addRecentSearch":
            // Decode and validate request
            let recentSearchRequest: ProtoAddRecentSearchRequest
            do {
                recentSearchRequest = try JSONDecoder().decode(ProtoAddRecentSearchRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            cloudKitStore.addRecentSearch(word: recentSearchRequest.word)
            validateAndComplete([ "success": true ], as: ProtoAddRecentSearchResponse.self)
            
        case "fetchRecentSearches":
            // Validate request using Codable
            do {
                _ = try JSONDecoder().decode(ProtoFetchRecentSearchesRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let searches = cloudKitStore.getRecentSearches()
            validateAndComplete([ "success": true, "recentSearches": searches ], as: ProtoFetchRecentSearchesResponse.self)
            
        case "fetchSettings":
            // Validate request using Codable
            do {
                _ = try JSONDecoder().decode(ProtoFetchSettingsRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let settings = cloudKitStore.getSettings()
            validateAndComplete([ "success": true, "settings": settings.toDictionary() ], as: ProtoFetchSettingsResponse.self)
            
        case "updateSettings":
            // Decode and validate request
            let updateSettingsRequest: ProtoUpdateSettingsRequest
            do {
                updateSettingsRequest = try JSONDecoder().decode(ProtoUpdateSettingsRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            // Convert Settings to dictionary for CloudKitStore
            var updates: [String: Any] = [:]
            if let theme = updateSettingsRequest.settings.theme {
                updates["theme"] = theme.rawValue
            }
            if let autoPlay = updateSettingsRequest.settings.autoPlayPronunciation {
                updates["autoPlayPronunciation"] = autoPlay
            }
            if let showExamples = updateSettingsRequest.settings.showExampleSentences {
                updates["showExampleSentences"] = showExamples
            }
            if let selectionMode = updateSettingsRequest.settings.textSelectionMode {
                updates["textSelectionMode"] = selectionMode.rawValue
            }
            if let autoAdd = updateSettingsRequest.settings.autoAddLookups {
                updates["autoAddLookups"] = autoAdd
            }
            
            let updatedSettings = cloudKitStore.updateSettings(updates)
            validateAndComplete([ "success": true, "settings": updatedSettings.toDictionary() ], as: ProtoUpdateSettingsResponse.self)
            
        case "incrementLookupCount":
            // Decode and validate request
            let incrementRequest: ProtoIncrementLookupCountRequest
            do {
                incrementRequest = try JSONDecoder().decode(ProtoIncrementLookupCountRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            cloudKitStore.incrementLookupCount(for: incrementRequest.word)
            validateAndComplete([ "success": true ], as: ProtoIncrementLookupCountResponse.self)
            
        case "fetchLookupStats": // Currently not used from JS side, reserved for future use
            // Validate request using Codable
            do {
                _ = try JSONDecoder().decode(ProtoFetchLookupStatsRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let stats = cloudKitStore.getLookupStats()
            validateAndComplete([ "success": true, "stats": stats ], as: ProtoFetchLookupStatsResponse.self)
            
        case "fetchLookupCount":
            // Decode and validate request
            let lookupCountRequest: ProtoFetchLookupCountRequest
            do {
                lookupCountRequest = try JSONDecoder().decode(ProtoFetchLookupCountRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let count = cloudKitStore.getLookupCount(for: lookupCountRequest.word)
            validateAndComplete([ "success": true, "count": count ], as: ProtoFetchLookupCountResponse.self)
            
        case "submitReview":
            // Decode and validate request
            let submitReviewRequest: ProtoSubmitReviewRequest
            do {
                submitReviewRequest = try JSONDecoder().decode(ProtoSubmitReviewRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            guard let listUUID = UUID(uuidString: submitReviewRequest.listID) else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid list ID format" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let reviewResponse = cloudKitStore.submitReview(
                word: submitReviewRequest.word,
                result: submitReviewRequest.reviewResult.rawValue,
                timeSpent: submitReviewRequest.timeSpent ?? 0.0,
                in: listUUID
            )
            validateAndComplete(reviewResponse, as: ProtoSubmitReviewResponse.self)
            
        case "updateWord":
            // Decode and validate request
            let updateWordRequest: ProtoUpdateWordRequest
            do {
                updateWordRequest = try JSONDecoder().decode(ProtoUpdateWordRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            guard let listUUID = UUID(uuidString: updateWordRequest.listID) else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid list ID format" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            // Convert updates to dictionary
            var updates: [String: Any] = [:]
            if let difficulty = updateWordRequest.updates.difficulty {
                updates["difficulty"] = difficulty
            }
            if let customNotes = updateWordRequest.updates.customNotes {
                updates["customNotes"] = customNotes
            }
            
            if let updatedWord = cloudKitStore.updateWord(word: updateWordRequest.word, updates: updates, in: listUUID) {
                validateAndComplete([ "success": true, "data": updatedWord.toDictionary() ], as: ProtoUpdateWordResponse.self)
            } else {
                fail("Failed to update word")
            }
            
        default:
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Unknown action: \(action)" ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
        }
    }
}
