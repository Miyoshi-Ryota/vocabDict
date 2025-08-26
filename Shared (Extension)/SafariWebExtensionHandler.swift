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
            
        default:
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "error": "Unknown action: \(action)" ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
        }
    }
}
