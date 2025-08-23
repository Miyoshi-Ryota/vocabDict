//
//  CloudKitStore.swift
//  vocabDict
//
//  Created by Ryota Miyoshi on 2025/8/22.
//

import CloudKit
import SwiftData
import os

class CloudKitStore {
    static let shared = CloudKitStore()
    private let modelContext: ModelContext

    private init() {
        do {
            // Local storage setup
            guard let appGroupURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: "group.com.vocabdict.shared"
            ) else {
                fatalError("App Group container URL not found")
            }
            try FileManager.default.createDirectory(at: appGroupURL, withIntermediateDirectories: true)
            let storeURL = appGroupURL.appendingPathComponent("VocabDict.store")

            // Online storage setup
            let schema = Schema([
                VocabularyList.self,
            ])

            let modelConfiguration = ModelConfiguration(
                schema: schema,
                url: storeURL,
                cloudKitDatabase: .automatic
            )

            let modelContainer = try ModelContainer(
                for: schema,
                configurations: [modelConfiguration]
            )

            modelContext = ModelContext(modelContainer)
            modelContext.autosaveEnabled = true
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }

    func save() {
        do {
            if modelContext.hasChanges {
                try modelContext.save()
            }
        } catch {
            print("Failed to save context: \(error)")
        }
    }

    func getVocabularyLists() -> [VocabularyList] {
        do {
            return try modelContext.fetch(FetchDescriptor<VocabularyList>())
        } catch {
            print("Failed to fetch vocabulary lists: \(error)")
            return []
        }
    }

    func getVocabularyList(id: UUID) -> VocabularyList? {
        do {
            let predicate = #Predicate<VocabularyList> { list in
                list.id == id
            }
            var descriptor = FetchDescriptor(predicate: predicate)
            descriptor.fetchLimit = 1
            return try self.modelContext.fetch(descriptor).first
        } catch {
            print("Failed to fetch: \(error)")
            return nil
        }
    }
    
    func createVocabularyList(name: String, isDefault: Bool = false) -> VocabularyList {
        let vocabularyList = VocabularyList(name: name, isDefault: isDefault)
        modelContext.insert(vocabularyList)
        do {
            try modelContext.save()
        } catch {
            print("Failed to save context: \(error)");
        }
        return vocabularyList
    }
    
    func addWordsToVocabularyList(words: [String: UserSpecificData], to vocabularyListId: UUID) {
        guard let vocabularyList = getVocabularyList(id: vocabularyListId) else {
            print("Vocabulary list with ID \(vocabularyListId) not found")
            return
        }


        for (word, userData) in words {
            if vocabularyList.words[word] != nil {
                print("Word '\(word)' already exists. Skipping...")
                continue
            }
            vocabularyList.words[word] = userData
        }
        do {
            try modelContext.save()
        } catch {
            print("Failed to save context: \(error)");
        }
    }
    
    // CloudKit sync status check
    func checkCloudKitSyncStatus() {
        os_log(.default, "MIYODBG === CloudKit Sync Status Check ===")
        
        // Check if iCloud is available
        if FileManager.default.ubiquityIdentityToken != nil {
            os_log(.default, "MIYODBG ✅ iCloud account is signed in")
        } else {
            os_log(.default, "MIYODBG ❌ No iCloud account signed in - CloudKit sync will not work!")
        }
        
        // Check local data
        do {
            let lists = try modelContext.fetch(FetchDescriptor<VocabularyList>())
            os_log(.default, "MIYODBG 📱 Local SwiftData: %d vocabulary lists", lists.count)
            for list in lists {
                os_log(.default, "MIYODBG   - %@ (id: %@, words: %d)", list.name, list.id.uuidString, list.words.count)
            }
        } catch {
            os_log(.default, "MIYODBG ❌ Failed to fetch local data: %@", error.localizedDescription)
        }
        
        // Check CloudKit container
        let container = CKContainer(identifier: "iCloud.com.vocabdict.sync")
        container.accountStatus { status, error in
            if let error = error {
                os_log(.default, "MIYODBG ❌ CloudKit account status error: %@", error.localizedDescription)
                return
            }
            
            switch status {
            case .available:
                os_log(.default, "MIYODBG ✅ CloudKit account is available")
                
                // Try to fetch records from CloudKit directly
                let database = container.privateCloudDatabase
                let query = CKQuery(recordType: "CD_VocabularyList", predicate: NSPredicate(value: true))
                
                database.fetch(withQuery: query) { result in
                    switch result {
                    case .success(let (matchResults, _)):
                        os_log(.default, "MIYODBG ☁️  CloudKit records found: %d", matchResults.count)
                        for (recordId, recordResult) in matchResults {
                            switch recordResult {
                            case .success(let record):
                                os_log(.default, "MIYODBG   - Record: %@", recordId.recordName)
                                if let name = record["CD_name"] as? String {
                                    os_log(.default, "MIYODBG     Name: %@", name)
                                }
                            case .failure(let error):
                                os_log(.default, "MIYODBG   - Failed to fetch record %@: %@", recordId.recordName, error.localizedDescription)
                            }
                        }
                    case .failure(let error):
                        os_log(.default, "MIYODBG ❌ CloudKit query failed: %@", error.localizedDescription)
                        os_log(.default, "MIYODBG    This might be normal if schema hasn't been created yet")
                    }
                }
                
            case .noAccount:
                os_log(.default, "MIYODBG ❌ No iCloud account")
            case .restricted:
                os_log(.default, "MIYODBG ❌ CloudKit access is restricted")
            case .couldNotDetermine:
                os_log(.default, "MIYODBG ⚠️  Could not determine CloudKit account status")
            case .temporarilyUnavailable:
                os_log(.default, "MIYODBG ⚠️  CloudKit is temporarily unavailable")
            @unknown default:
                os_log(.default, "MIYODBG ⚠️  Unknown CloudKit account status")
            }
        }
        
        os_log(.default, "MIYODBG =================================")
        os_log(.default, "MIYODBG Note: CloudKit sync can take several minutes.")
        os_log(.default, "MIYODBG If schema hasn't been created yet, try:")
        os_log(.default, "MIYODBG 1. Make sure you're signed into iCloud")
        os_log(.default, "MIYODBG 2. Create some data and wait a few minutes")
        os_log(.default, "MIYODBG 3. Check CloudKit Dashboard at https://icloud.developer.apple.com/")
        os_log(.default, "MIYODBG 4. Look for 'iCloud.com.vocabdict.sync' container")
    }
    
    // Debug method to clear all local data
    func clearAllLocalData() {
        print("MIYO DBG Clearing all local SwiftData")
        do {
            let lists = try modelContext.fetch(FetchDescriptor<VocabularyList>())
            for list in lists {
                print("MIYO DBG Deleting list: \(list.name) (id: \(list.id))")
                modelContext.delete(list)
            }
            try modelContext.save()
            print("MIYO DBG All local data cleared")
        } catch {
            print("MIYO DBG Failed to clear local data: \(error)")
        }
    }
}

