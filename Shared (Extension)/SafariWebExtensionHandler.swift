//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by Ryota Miyoshi on 2025/7/19.
//

import SafariServices
import CloudKit
import os.log

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

        switch action {
        case "devResetAllData":
            // Development-only: prefer official container deletion, then purge files + CloudKit for multiple containers.
            do {
                var results: [String: Any] = [:]
                // 0) Try container-level deletion first (official API)
                results["containerDelete"] = CloudKitStore.shared.deleteAllDataUsingContainer()

                // 1) Remove on-disk store files under App Group directly (belt-and-suspenders)
                var localSummary: [String: Any] = [:]
                if let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.vocabdict.shared") {
                    let base = appGroupURL.appendingPathComponent("VocabDict.store")
                    let candidates = [base, URL(fileURLWithPath: base.path + "-wal"), URL(fileURLWithPath: base.path + "-shm")]
                    var removed: [String] = []
                    var notFound: [String] = []
                    var errors: [String] = []
                    for url in candidates {
                        if FileManager.default.fileExists(atPath: url.path) {
                            do { try FileManager.default.removeItem(at: url); removed.append(url.lastPathComponent) }
                            catch { errors.append("\(url.lastPathComponent): \(error.localizedDescription)") }
                        } else { notFound.append(url.lastPathComponent) }
                    }
                    localSummary["removed"] = removed
                    if !notFound.isEmpty { localSummary["notFound"] = notFound }
                    if !errors.isEmpty { localSummary["errors"] = errors }
                } else {
                    localSummary["error"] = "app_group_not_found"
                }
                results["localStore"] = localSummary

                // 2) Multi-container CloudKit purge
                let requestedContainers = (messageDict["containers"] as? [String])
                let defaultCandidates = [
                    "iCloud.com.vocabdict.sync",
                    "iCloud.com.ryota.miyoshi.vocabdict",
                    "iCloud.com.ryota.miyoshi.vocabdict.extension"
                ]
                let containerIDs = requestedContainers ?? defaultCandidates
                let outer = DispatchGroup()
                var ckAll: [String: Any] = [:]

                for id in containerIDs {
                    outer.enter()
                    let container = CKContainer(identifier: id)
                    let db = container.privateCloudDatabase
                    var summary: [String: Any] = [:]
                    let inner = DispatchGroup()

                    // 2a) Delete non-default zones
                    inner.enter()
                    db.fetchAllRecordZones { zones, error in
                        if let error = error {
                            summary["zones"] = ["error": error.localizedDescription]
                            inner.leave()
                            return
                        }
                        guard let zones = zones else {
                            summary["zones"] = ["deleted": 0]
                            inner.leave()
                            return
                        }
                        let nonDefault = zones.filter { $0.zoneID.zoneName != CKRecordZone.ID.defaultZoneName }
                        if nonDefault.isEmpty {
                            summary["zones"] = ["deleted": 0]
                            inner.leave()
                        } else {
                            let op = CKModifyRecordZonesOperation(recordZonesToSave: nil, recordZoneIDsToDelete: nonDefault.map { $0.zoneID })
                            op.modifyRecordZonesCompletionBlock = { _, deleted, err in
                                if let err = err {
                                    summary["zones"] = ["error": err.localizedDescription]
                                } else {
                                    summary["zones"] = ["deleted": deleted?.count ?? nonDefault.count]
                                }
                                inner.leave()
                            }
                            db.add(op)
                        }
                    }

                    // 2b) Delete records in default zone for known mirrored types (best-effort)
                    let recordTypes = [
                        "VocabularyList",
                        "RecentSearchHistory",
                        "UserSettings",
                        "DictionaryLookupStats",
                        // Common CoreData/SwiftData mirrored naming often starts with 'CD_'
                        "CD_VocabularyList",
                        "CD_RecentSearchHistory",
                        "CD_UserSettings",
                        "CD_DictionaryLookupStats"
                    ]
                    for type in recordTypes {
                        inner.enter()
                        let query = CKQuery(recordType: type, predicate: NSPredicate(value: true))
                        let op = CKQueryOperation(query: query)
                        op.resultsLimit = 200
                        var fetchedIDs: [CKRecord.ID] = []
                        op.recordFetchedBlock = { record in fetchedIDs.append(record.recordID) }
                        op.queryCompletionBlock = { _, _ in
                            if fetchedIDs.isEmpty {
                                summary[type] = ["deleted": 0]
                                inner.leave()
                                return
                            }
                            let delOp = CKModifyRecordsOperation(recordsToSave: nil, recordIDsToDelete: fetchedIDs)
                            delOp.modifyRecordsCompletionBlock = { _, deletedIDs, error in
                                if let error = error {
                                    summary[type] = ["error": error.localizedDescription]
                                } else {
                                    summary[type] = ["deleted": deletedIDs?.count ?? fetchedIDs.count]
                                }
                                inner.leave()
                            }
                            db.add(delOp)
                        }
                        db.add(op)
                    }

                    inner.notify(queue: .main) {
                        ckAll[id] = summary
                        outer.leave()
                    }
                }

                outer.notify(queue: .main) {
                    results["cloudKit"] = ckAll
                    results["note"] = "Restart the app/extension to fully apply reset"
                    complete(["success": true, "data": results])
                }
            }

        case "fetchVocabularyListWords":
            // Decode and validate request
            let req: ProtoFetchVocabularyListWordsRequest
            do {
                req = try JSONDecoder().decode(ProtoFetchVocabularyListWordsRequest.self, from: jsonData)
            } catch {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "Invalid request format: \(error.localizedDescription)" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }

            // NOTE:
            //  - 将来的にこの SafariWebExtensionHandler は「極力薄く」保つ方針です。
            //  - コマンドパターン採用後は、本ケースのフィルタ/ソート/lookupStats 構築などのロジックは
            //    SomeCommand.from_proto(req, ctx).execute() 側へ移し、ここでは
            //      受信 → デコード → コマンド実行 → エンコード（検証）
            //    のみを担う予定です。
            //  - 現時点では JS 側からの素通し要件に合わせて、最小限の組み立てをこのハンドラ内で実施しています。

            guard let listUUID = UUID(uuidString: req.listID), let vocabularyList = cloudKitStore.getVocabularyList(id: listUUID) else {
                let response = NSExtensionItem()
                response.userInfo = [ SFExtensionMessageKey: [ "success": false, "error": "List not found" ] ]
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
                return
            }

            // Start from model objects for filtering/sorting fidelity
            var items = Array(vocabularyList.words.values)

            // Filter by difficulty bucket if requested
            if let filter = req.filterBy?.rawValue, filter != "all" {
                func bucket(_ d: Int) -> String { return d <= 3000 ? "easy" : (d < 10000 ? "medium" : "hard") }
                items = items.filter { bucket($0.difficulty) == filter }
            }

            // Build lookup stats map for current words
            let allStats = cloudKitStore.getLookupStats() // [word: dict]
            var filteredStats: [String: Any] = [:]
            let wordsSet = Set(items.map { $0.word.lowercased() })
            for (word, stat) in allStats where wordsSet.contains(word) {
                filteredStats[word] = stat
            }

            // Sorting
            if let sortBy = req.sortBy?.rawValue {
                let desc = (req.sortOrder?.rawValue == "desc")
                func cmp<T: Comparable>(_ a: T, _ b: T) -> Bool { return desc ? (a > b) : (a < b) }
                switch sortBy {
                case "alphabetical":
                    items.sort { cmp($0.word, $1.word) }
                case "dateAdded":
                    items.sort { cmp($0.dateAdded, $1.dateAdded) }
                case "lastReviewed":
                    // Keep nils at the end regardless of order
                    let reviewed = items.filter { $0.lastReviewed != nil }
                    let notReviewed = items.filter { $0.lastReviewed == nil }
                    let sorted = reviewed.sorted { (a, b) in
                        guard let la = a.lastReviewed, let lb = b.lastReviewed else { return false }
                        return desc ? (la > lb) : (la < lb)
                    }
                    items = sorted + notReviewed
                case "difficulty":
                    items.sort { cmp($0.difficulty, $1.difficulty) }
                case "lookupCount":
                    func count(_ w: String) -> Int { (filteredStats[w.lowercased()] as? [String: Any])? ["count"] as? Int ?? 0 }
                    items.sort { cmp(count($0.word), count($1.word)) }
                default:
                    break
                }
            }

            let wordsPayload = items.map { $0.toDictionary() }
            validateAndComplete([ "success": true, "data": [
                "words": wordsPayload,
                "lookupStats": filteredStats
            ]], as: ProtoFetchVocabularyListWordsResponse.self)

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
