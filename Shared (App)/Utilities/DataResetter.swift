//
//  DataResetter.swift
//  Shared utility to perform the same full reset logic as handler's devResetAllData
//

import Foundation
import CloudKit

enum DataResetter {
    /// Runs a best-effort full reset across local SwiftData store and CloudKit.
    /// - Parameter containers: Optional list of iCloud container identifiers to purge. If nil, defaults are used.
    /// - Returns: Summary dictionary for diagnostics.
    static func runFullReset(containers: [String]? = nil) -> [String: Any] {
        var results: [String: Any] = [:]

        // 0) Try official container-level deletion (iOS 18/macOS 15+)
        results["containerDelete"] = CloudKitStore.shared.deleteAllDataUsingContainer()

        // 1) Remove on-disk store files under App Group directly
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

        // 2) Multi-container CloudKit purge (non-default zones + known record types in default zone)
        let defaultCandidates = [
            "iCloud.com.vocabdict.sync",
            "iCloud.com.ryota.miyoshi.vocabdict",
            "iCloud.com.ryota.miyoshi.vocabdict.extension"
        ]
        let containerIDs = containers ?? defaultCandidates
        let outer = DispatchGroup()
        var ckAll: [String: Any] = [:]
        let lock = NSLock()

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
                    inner.leave(); return
                }
                guard let zones = zones else {
                    summary["zones"] = ["deleted": 0]
                    inner.leave(); return
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
                        inner.leave(); return
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

            inner.notify(queue: .global()) {
                lock.lock(); ckAll[id] = summary; lock.unlock()
                outer.leave()
            }
        }

        // Wait (with generous timeout) for CloudKit ops to finish
        _ = outer.wait(timeout: .now() + 30)
        results["cloudKit"] = ckAll
        results["note"] = "Restart the app/extension to fully apply reset"

        // Persist last summary for UI display
        if let json = try? JSONSerialization.data(withJSONObject: results, options: [.prettyPrinted]),
           let str = String(data: json, encoding: .utf8) {
            UserDefaults.standard.set(str, forKey: "DevResetLastSummary")
        }

        return results
    }
}

