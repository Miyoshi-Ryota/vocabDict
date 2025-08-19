//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by Ryota Miyoshi on 2025/7/19.
//

import SafariServices
import SwiftData

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    var modelContainer: ModelContainer {
        return DataController.shared.modelContainer
    }

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        
        guard let messageDict = message as? [String: Any],
              let action = messageDict["action"] as? String else {
            let response = NSExtensionItem()
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "error": "Invalid message format" ] ]
            } else {
                response.userInfo = [ "message": [ "error": "Invalid message format" ] ]
            }
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
            return
        }
        
        let modelContext = ModelContext(modelContainer)
        
        // Use Task to handle @MainActor methods
        Task { @MainActor in
            switch action {
            case "getVocabularyLists":
                await fetchVocabularyLists(modelContext: modelContext, context: context)
            case "addWord":
                await addWord(message: messageDict, modelContext: modelContext, context: context)
            case "getSettings":
                await fetchSettings(modelContext: modelContext, context: context)
            case "updateSettings":
                await updateSettings(message: messageDict, modelContext: modelContext, context: context)
            case "getReviewSession":
                await fetchReviewSession(modelContext: modelContext, context: context)
            case "syncData":
                triggerSync(context: context)
            default:
                let response = NSExtensionItem()
                if #available(iOS 15.0, macOS 11.0, *) {
                    response.userInfo = [ SFExtensionMessageKey: [ "error": "Unknown action: \(action)" ] ]
                } else {
                    response.userInfo = [ "message": [ "error": "Unknown action: \(action)" ] ]
                }
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
            }
        }
    }
    
    @MainActor
    private func fetchVocabularyLists(modelContext: ModelContext, context: NSExtensionContext) async {
        let descriptor = FetchDescriptor<VocabularyList>(
            sortBy: [SortDescriptor(\.created, order: .reverse)]
        )
        
        do {
            let lists = try modelContext.fetch(descriptor)
            let jsFormat = lists.map { list in
                list.toJavaScriptFormat()
            }
            sendResponse(["vocab_lists": jsFormat], to: context)
        } catch {
            sendError(error, to: context)
        }
    }
    
    @MainActor
    private func addWord(message: [String: Any], modelContext: ModelContext, context: NSExtensionContext) async {
        guard let wordText = message["word"] as? String else {
            sendError(NSError(domain: "VocabDict", code: 1, userInfo: [NSLocalizedDescriptionKey: "Word text is required"]), to: context)
            return
        }
        
        let word = Word(word: wordText)
        
        if let listId = message["listId"] as? String,
           let uuid = UUID(uuidString: listId) {
            let descriptor = FetchDescriptor<VocabularyList>(
                predicate: #Predicate { $0.id == uuid }
            )
            
            do {
                if let list = try modelContext.fetch(descriptor).first {
                    word.list = list
                }
            } catch {
                print("Failed to find list: \(error)")
            }
        } else {
            let descriptor = FetchDescriptor<VocabularyList>(
                predicate: #Predicate { $0.isDefault == true }
            )
            
            do {
                if let defaultList = try modelContext.fetch(descriptor).first {
                    word.list = defaultList
                } else {
                    let newList = VocabularyList(name: "Default List", isDefault: true)
                    modelContext.insert(newList)
                    word.list = newList
                }
            } catch {
                print("Failed to get default list: \(error)")
            }
        }
        
        modelContext.insert(word)
        
        do {
            try modelContext.save()
            DataController.shared.save()
            
            let sharedDefaults = UserDefaults(suiteName: "group.com.vocabdict.shared")
            sharedDefaults?.set(true, forKey: "pendingSync")
            sharedDefaults?.set(Date(), forKey: "lastModified")
            
            sendResponse(["success": true, "wordId": word.id.uuidString], to: context)
        } catch {
            sendError(error, to: context)
        }
    }
    
    @MainActor
    private func fetchSettings(modelContext: ModelContext, context: NSExtensionContext) async {
        let singletonID = Settings.singletonID
        let descriptor = FetchDescriptor<Settings>(
            predicate: #Predicate { $0.id == singletonID }
        )
        
        do {
            let settings = try modelContext.fetch(descriptor).first ?? {
                let newSettings = Settings()
                modelContext.insert(newSettings)
                try? modelContext.save()
                return newSettings
            }()
            
            let jsFormat: [String: Any] = [
                "theme": settings.theme,
                "autoPlayPronunciation": settings.autoPlayPronunciation,
                "showExampleSentences": settings.showExampleSentences,
                "textSelectionMode": settings.textSelectionMode
            ]
            
            sendResponse(["settings": jsFormat], to: context)
        } catch {
            sendError(error, to: context)
        }
    }
    
    @MainActor
    private func updateSettings(message: [String: Any], modelContext: ModelContext, context: NSExtensionContext) async {
        guard let settingsData = message["settings"] as? [String: Any] else {
            sendError(NSError(domain: "VocabDict", code: 1, userInfo: [NSLocalizedDescriptionKey: "Settings data is required"]), to: context)
            return
        }
        
        let singletonID = Settings.singletonID
        let descriptor = FetchDescriptor<Settings>(
            predicate: #Predicate { $0.id == singletonID }
        )
        
        do {
            let settings = try modelContext.fetch(descriptor).first ?? {
                let newSettings = Settings()
                modelContext.insert(newSettings)
                return newSettings
            }()
            
            if let theme = settingsData["theme"] as? String {
                settings.theme = theme
            }
            if let autoPlay = settingsData["autoPlayPronunciation"] as? Bool {
                settings.autoPlayPronunciation = autoPlay
            }
            if let showExamples = settingsData["showExampleSentences"] as? Bool {
                settings.showExampleSentences = showExamples
            }
            if let selectionMode = settingsData["textSelectionMode"] as? String {
                settings.textSelectionMode = selectionMode
            }
            
            settings.lastModified = Date()
            
            try modelContext.save()
            
            let sharedDefaults = UserDefaults(suiteName: "group.com.vocabdict.shared")
            sharedDefaults?.set(true, forKey: "pendingSync")
            
            sendResponse(["success": true], to: context)
        } catch {
            sendError(error, to: context)
        }
    }
    
    @MainActor
    private func fetchReviewSession(modelContext: ModelContext, context: NSExtensionContext) async {
        let descriptor = FetchDescriptor<ReviewSession>(
            predicate: #Predicate { $0.endTime == nil },
            sortBy: [SortDescriptor(\.startTime, order: .reverse)]
        )
        
        do {
            if let session = try modelContext.fetch(descriptor).first {
                let jsFormat: [String: Any] = [
                    "id": session.id.uuidString,
                    "startTime": ISO8601DateFormatter().string(from: session.startTime),
                    "wordsReviewed": session.wordsReviewed,
                    "currentWordIndex": session.currentWordIndex
                ]
                sendResponse(["session": jsFormat], to: context)
            } else {
                sendResponse(["session": nil], to: context)
            }
        } catch {
            sendError(error, to: context)
        }
    }
    
    private func triggerSync(context: NSExtensionContext) {
        let sharedDefaults = UserDefaults(suiteName: "group.com.vocabdict.shared")
        sharedDefaults?.set(true, forKey: "pendingSync")
        sharedDefaults?.set(Date(), forKey: "lastSyncRequest")
        
        sendResponse(["success": true, "message": "Sync triggered"], to: context)
    }
    
    private func sendResponse(_ response: Any, to context: NSExtensionContext) {
        let item = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            item.userInfo = [SFExtensionMessageKey: response]
        } else {
            item.userInfo = ["message": response]
        }
        context.completeRequest(returningItems: [item], completionHandler: nil)
    }
    
    private func sendError(_ error: Error, to context: NSExtensionContext) {
        sendResponse(["error": error.localizedDescription], to: context)
    }

}

extension VocabularyList {
    func toJavaScriptFormat() -> [String: Any] {
        var wordsDict: [String: Any] = [:]
        
        for word in words ?? [] {
            wordsDict[word.normalizedWord] = [
                "word": word.word,
                "dateAdded": ISO8601DateFormatter().string(from: word.dateAdded),
                "difficulty": word.difficulty,
                "customNotes": word.customNotes,
                "lastReviewed": word.lastReviewed.map { ISO8601DateFormatter().string(from: $0) },
                "nextReview": ISO8601DateFormatter().string(from: word.nextReview),
                "reviewHistory": word.reviewHistory?.map { history in
                    [
                        "date": ISO8601DateFormatter().string(from: history.date),
                        "result": history.result,
                        "timeSpent": history.timeSpent
                    ]
                } ?? []
            ]
        }
        
        return [
            "id": id.uuidString,
            "name": name,
            "created": ISO8601DateFormatter().string(from: created),
            "isDefault": isDefault,
            "words": wordsDict
        ]
    }
}
