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
            response.userInfo = [ SFExtensionMessageKey: [ "error": "Invalid message format" ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            return
        }
        
        os_log(.default, "Processing action: %@", action)
        
        switch action {
        case "getVocabularyLists":
            let lists = cloudKitStore.getVocabularyLists()
            let listsData = lists.map { $0.toDictionary() }
            
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "vocabularyLists": listsData ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "createVocabularyList":
            guard let name = messageDict["name"] as? String else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "error": "Name is required" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let isDefault = messageDict["isDefault"] as? Bool ?? false
            let newList = cloudKitStore.createVocabularyList(name: name, isDefault: isDefault)
            
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "vocabularyList": newList.toDictionary() ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "addWordToList":
            guard let listId = messageDict["listId"] as? String,
                  let listUUID = UUID(uuidString: listId),
                  let word = messageDict["word"] as? String else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "error": "Invalid parameters: listId and word are required" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            // Extract optional metadata
            let metadata = messageDict["metadata"] as? [String: String] ?? [:]
            
            // Add word to list
            if let wordEntry = cloudKitStore.addWordToVocabularyList(word: word, metadata: metadata, to: listUUID) {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ 
                    "success": true, 
                    "data": wordEntry.toDictionary() 
                ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
            } else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "error": "Failed to add word to list" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
            }
            
        case "addRecentSearch":
            guard let word = messageDict["word"] as? String else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "error": "Word is required" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            cloudKitStore.addRecentSearch(word: word)
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "getRecentSearches":
            let searches = cloudKitStore.getRecentSearches()
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "recentSearches": searches ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "getSettings":
            let settings = cloudKitStore.getSettings()
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "settings": settings.toDictionary() ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "updateSettings":
            guard let updates = messageDict["settings"] as? [String: Any] else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "error": "Settings updates are required" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let updatedSettings = cloudKitStore.updateSettings(updates)
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "settings": updatedSettings.toDictionary() ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "incrementLookupCount":
            guard let word = messageDict["word"] as? String else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "error": "Word is required" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            cloudKitStore.incrementLookupCount(for: word)
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "getLookupStats":
            let stats = cloudKitStore.getLookupStats()
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "stats": stats ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "getLookupCount":
            guard let word = messageDict["word"] as? String else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "error": "Word is required" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            let count = cloudKitStore.getLookupCount(for: word)
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "count": count ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        default:
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "error": "Unknown action: \(action)" ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
        }
    }
}
