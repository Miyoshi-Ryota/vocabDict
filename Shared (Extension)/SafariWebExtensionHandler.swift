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
            // Debug: Check sync status when fetching lists
            cloudKitStore.checkCloudKitSyncStatus()

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
            
            // Debug: Check sync status after creating a list
            cloudKitStore.checkCloudKitSyncStatus()
            
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "vocabularyList": newList.toDictionary() ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        case "addWordsToVocabularyList":
            guard let listId = messageDict["listId"] as? String,
                  let listUUID = UUID(uuidString: listId),
                  let wordsDict = messageDict["words"] as? [String: [String: Any]] else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "error": "Invalid parameters" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }
            
            var words: [String: UserSpecificData] = [:]
            for (word, data) in wordsDict {
                let userData = UserSpecificData(
                    word: word,
                    difficulty: data["difficulty"] as? String ?? "medium",
                    customNotes: data["customNotes"] as? String ?? "",
                )
                words[word] = userData
            }
            
            cloudKitStore.addWordsToVocabularyList(words: words, to: listUUID)
            
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": true ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            
        default:
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "error": "Unknown action: \(action)" ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
        }
    }
}
