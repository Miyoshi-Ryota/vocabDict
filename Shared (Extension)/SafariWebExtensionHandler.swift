//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by Ryota Miyoshi on 2025/7/19.
//

import SafariServices
import CloudKit
import os.log
import SwiftData

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    // Access CloudKitStore via computed property so we can swap instances during dev reset
    var cloudKitStore: CloudKitStore { CloudKitStore.shared }
    
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

        // MARK: - Generic Command Runner Helpers
        func encodeCodableToDict<T: Encodable>(_ model: T) throws -> [String: Any] {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let encoded = try encoder.encode(model)
            let jsonObject = try JSONSerialization.jsonObject(with: encoded, options: [])
            guard let dict = jsonObject as? [String: Any] else {
                throw NSError(domain: "EncodeCodableToDict", code: -1, userInfo: [NSLocalizedDescriptionKey: "Response encoding produced non-dictionary JSON"])
            }
            return dict
        }

        func runCommand<Request: Decodable, Response: Encodable>(
            _ data: Data,
            reqType: Request.Type,
            context: ModelContext,
            make: (Request, ModelContext) throws -> Response
        ) {
            // First: strict request decoding
            let req: Request
            do {
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                req = try decoder.decode(Request.self, from: data)
            } catch {
                fail("Invalid request format: \(error.localizedDescription)")
                return
            }

            // Second: command execution
            do {
                let resp = try make(req, context)
                let dict = try encodeCodableToDict(resp)
                complete(dict)
            } catch {
                fail("Command execution failed: \(error.localizedDescription)")
            }
        }

        switch action {
        case "devResetAllData":
            // Development-only: run the same logic via shared utility for parity with macOS app
            let requestedContainers = (messageDict["containers"] as? [String])
            let results = DataResetter.runFullReset(containers: requestedContainers)
            complete(["success": true, "data": results])

        case "fetchVocabularyListWords":
            runCommand(jsonData, reqType: ProtoFetchVocabularyListWordsRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try FetchVocabularyListWordsCommand.fromProto(req, context: ctx).execute()
            }

        case "fetchAllVocabularyLists":
            runCommand(jsonData, reqType: ProtoFetchAllVocabularyListsRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try FetchAllVocabularyListsCommand.fromProto(req, context: ctx).execute()
            }
            
        case "createVocabularyList":
            runCommand(jsonData, reqType: ProtoCreateVocabularyListRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try CreateVocabularyListCommand.fromProto(req, context: ctx).execute()
            }
            
        case "addWordToVocabularyList":
            runCommand(jsonData, reqType: ProtoAddWordToVocabularyListRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try AddWordToVocabularyListCommand.fromProto(req, context: ctx).execute()
            }
            
        case "addRecentSearch":
            runCommand(jsonData, reqType: ProtoAddRecentSearchRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try AddRecentSearchCommand.fromProto(req, context: ctx).execute()
            }
            
        case "fetchRecentSearches":
            runCommand(jsonData, reqType: ProtoFetchRecentSearchesRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try FetchRecentSearchesCommand.fromProto(req, context: ctx).execute()
            }
            
        case "fetchSettings":
            runCommand(jsonData, reqType: ProtoFetchSettingsRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try FetchSettingsCommand.fromProto(req, context: ctx).execute()
            }
            
        case "updateSettings":
            runCommand(jsonData, reqType: ProtoUpdateSettingsRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try UpdateSettingsCommand.fromProto(req, context: ctx).execute()
            }
            
        case "incrementLookupCount":
            runCommand(jsonData, reqType: ProtoIncrementLookupCountRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try IncrementLookupCountCommand.fromProto(req, context: ctx).execute()
            }
            
        case "fetchLookupStats": // Currently not used from JS side, reserved for future use
            runCommand(jsonData, reqType: ProtoFetchLookupStatsRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try FetchLookupStatsCommand.fromProto(req, context: ctx).execute()
            }
            
        case "fetchLookupCount":
            runCommand(jsonData, reqType: ProtoFetchLookupCountRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try FetchLookupCountCommand.fromProto(req, context: ctx).execute()
            }
            
        case "submitReview":
            runCommand(jsonData, reqType: ProtoSubmitReviewRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try SubmitReviewCommand.fromProto(req, context: ctx).execute()
            }
            
        case "updateWord":
            runCommand(jsonData, reqType: ProtoUpdateWordRequest.self, context: CloudKitStore.shared.modelContext) { req, ctx in
                try UpdateWordCommand.fromProto(req, context: ctx).execute()
            }
            
        default:
            let response = NSExtensionItem()
            response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Unknown action: \(action)" ] ]
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
        }
    }
}
