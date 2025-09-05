//
//  CloudKitStore.swift
//  vocabDict
//
//  Created by Ryota Miyoshi on 2025/8/22.
//

import CloudKit
import Foundation
import SwiftData
import os.log

class CloudKitStore {
    // Use in-memory store when running under XCTest to avoid App Group access prompts
    static var shared: CloudKitStore = {
        if ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil {
            return CloudKitStore(inMemory: true)
        } else {
            return CloudKitStore()
        }
    }()
    let modelContext: ModelContext
    let modelContainer: ModelContainer
    let storeURL: URL?

    init(inMemory: Bool = false) {
        do {
            let schema = Schema([
                VocabularyList.self,
                RecentSearchHistory.self,
                UserSettings.self,
                DictionaryLookupStats.self,
            ])

            let modelConfiguration: ModelConfiguration
            if inMemory {
                modelConfiguration = ModelConfiguration(
                    schema: schema,
                    isStoredInMemoryOnly: true,
                    cloudKitDatabase: .none
                )
                self.storeURL = nil
            } else {
                guard let appGroupURL = FileManager.default.containerURL(
                    forSecurityApplicationGroupIdentifier: "group.com.vocabdict.shared"
                ) else {
                    fatalError("App Group container URL not found")
                }
                try FileManager.default.createDirectory(at: appGroupURL, withIntermediateDirectories: true)
                let storeURL = appGroupURL.appendingPathComponent("VocabDict.store")
                modelConfiguration = ModelConfiguration(
                    schema: schema,
                    url: storeURL,
                    cloudKitDatabase: .automatic
                )
                self.storeURL = storeURL
            }

            modelContainer = try ModelContainer(
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
            os_log(.default, "Failed to save context: \(error)")
        }
    }

    /// Prefer official container-level deletion when available.
    /// Returns a short status string.
    func deleteAllDataUsingContainer() -> String {
        if #available(macOS 15.0, iOS 18.0, *) {
            do {
                try modelContainer.deleteAllData()
                return "ok"
            } catch {
                return "error: \(error.localizedDescription)"
            }
        } else {
            return "unavailable"
        }
    }
}
