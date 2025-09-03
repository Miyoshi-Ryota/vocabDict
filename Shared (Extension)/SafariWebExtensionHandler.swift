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
        
        switch action {
        case "fetchAllVocabularyLists":
            // Validate request using Codable
            do {
                _ = try JSONDecoder().decode(FetchAllVocabularyListsRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let lists = cloudKitStore.getVocabularyLists()
            let listsData = lists.map { $0.toDictionary() }
            
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true, "vocabularyLists": listsData ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "createVocabularyList":
            // Decode and validate request
            let createRequest: CreateVocabularyListRequest
            do {
                createRequest = try JSONDecoder().decode(CreateVocabularyListRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let newList = cloudKitStore.createVocabularyList(name: createRequest.name, isDefault: createRequest.isDefault ?? false)
            
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true, "vocabularyList": newList.toDictionary() ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "addWordToVocabularyList":
            // Decode and validate request
            let addWordRequest: AddWordToVocabularyListRequest
            do {
                addWordRequest = try JSONDecoder().decode(AddWordToVocabularyListRequest.self, from: jsonData)
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
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ 
                    "success": true, 
                    "data": wordEntry.toDictionary() 
                ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
            } else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Failed to add word to list" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
            }
            
        case "addRecentSearch":
            // Decode and validate request
            let recentSearchRequest: AddRecentSearchRequest
            do {
                recentSearchRequest = try JSONDecoder().decode(AddRecentSearchRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            cloudKitStore.addRecentSearch(word: recentSearchRequest.word)
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "fetchRecentSearches":
            // Validate request using Codable
            do {
                _ = try JSONDecoder().decode(FetchRecentSearchesRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let searches = cloudKitStore.getRecentSearches()
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true, "recentSearches": searches ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "fetchSettings":
            // Validate request using Codable
            do {
                _ = try JSONDecoder().decode(FetchSettingsRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let settings = cloudKitStore.getSettings()
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true, "settings": settings.toDictionary() ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "updateSettings":
            // Decode and validate request
            let updateSettingsRequest: UpdateSettingsRequest
            do {
                updateSettingsRequest = try JSONDecoder().decode(UpdateSettingsRequest.self, from: jsonData)
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
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true, "settings": updatedSettings.toDictionary() ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "incrementLookupCount":
            // Decode and validate request
            let incrementRequest: IncrementLookupCountRequest
            do {
                incrementRequest = try JSONDecoder().decode(IncrementLookupCountRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            cloudKitStore.incrementLookupCount(for: incrementRequest.word)
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "fetchLookupStats": // Currently not used from JS side, reserved for future use
            // Validate request using Codable
            do {
                _ = try JSONDecoder().decode(FetchLookupStatsRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let stats = cloudKitStore.getLookupStats()
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true, "stats": stats ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "fetchLookupCount":
            // Decode and validate request
            let lookupCountRequest: FetchLookupCountRequest
            do {
                lookupCountRequest = try JSONDecoder().decode(FetchLookupCountRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let count = cloudKitStore.getLookupCount(for: lookupCountRequest.word)
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true, "count": count ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "submitReview":
            // Decode and validate request
            let submitReviewRequest: SubmitReviewRequest
            do {
                submitReviewRequest = try JSONDecoder().decode(SubmitReviewRequest.self, from: jsonData)
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
            
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: reviewResponse ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "updateWord":
            // Decode and validate request
            let updateWordRequest: UpdateWordRequest
            do {
                updateWordRequest = try JSONDecoder().decode(UpdateWordRequest.self, from: jsonData)
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
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ 
                    "success": true,
                    "data": updatedWord.toDictionary()
                ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
            } else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Failed to update word" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
            }
            
        default:
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Unknown action: \(action)" ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
        }
    }
}
