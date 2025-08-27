//
//  CloudKitStore.swift
//  vocabDict
//
//  Created by Ryota Miyoshi on 2025/8/22.
//

import CloudKit
import SwiftData
import os.log

class CloudKitStore {
    static let shared = CloudKitStore()
    let modelContext: ModelContext
    let modelContainer: ModelContainer

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
                RecentSearchHistory.self,
                UserSettings.self,
            ])

            let modelConfiguration = ModelConfiguration(
                schema: schema,
                url: storeURL,
                cloudKitDatabase: .automatic
            )

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

    func getVocabularyLists() -> [VocabularyList] {
        do {
            return try modelContext.fetch(FetchDescriptor<VocabularyList>())
        } catch {
            os_log(.default, "Failed to fetch vocabulary lists: \(error)")
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
            os_log(.default, "Failed to fetch: \(error)")
            return nil
        }
    }
    
    func createVocabularyList(name: String, isDefault: Bool = false) -> VocabularyList {
        let vocabularyList = VocabularyList(name: name, isDefault: isDefault)
        modelContext.insert(vocabularyList)
        save()
        return vocabularyList
    }
    
    func addWordToVocabularyList(word: String, metadata: [String: String], to vocabularyListId: UUID) -> UserSpecificData? {
        guard let vocabularyList = getVocabularyList(id: vocabularyListId) else {
            os_log(.default, "Vocabulary list with ID \(vocabularyListId.uuidString) not found")
            return nil
        }
        
        let normalizedWord = word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Check if word already exists
        if vocabularyList.words[normalizedWord] != nil {
            os_log(.default, "Word '\(normalizedWord)' already exists in list")
            return nil
        }
        
        // Create new UserSpecificData with automatic values
        let userData = UserSpecificData(
            word: word,
            dateAdded: Date(),
            difficulty: metadata["difficulty"] ?? "medium",
            customNotes: metadata["customNotes"] ?? "",
            lastReviewed: nil,
            nextReviewDate: Date(timeIntervalSinceNow: 86400),  // Tomorrow
            reviewHistory: []
        )
        
        vocabularyList.words[normalizedWord] = userData
        save()
        return userData
    }
    
    // MARK: - Recent Search History
    
    func addRecentSearch(word: String) {
        let normalizedWord = word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        // First, remove any existing entry for the same word
        do {
            let predicate = #Predicate<RecentSearchHistory> { search in
                search.word == normalizedWord
            }
            let existingSearches = try modelContext.fetch(FetchDescriptor(predicate: predicate))
            for search in existingSearches {
                modelContext.delete(search)
            }
        } catch {
            os_log(.default, "Failed to check for existing searches: \(error)")
        }
        
        // Add the new search
        let newSearch = RecentSearchHistory(word: normalizedWord, searchedAt: Date())
        modelContext.insert(newSearch)
        
        // Keep only the most recent 10 searches
        do {
            var descriptor = FetchDescriptor<RecentSearchHistory>(
                sortBy: [SortDescriptor(\.searchedAt, order: .reverse)]
            )
            let allSearches = try modelContext.fetch(descriptor)
            
            if allSearches.count > 10 {
                // Delete the older searches
                for i in 10..<allSearches.count {
                    modelContext.delete(allSearches[i])
                }
            }
        } catch {
            os_log(.default, "Failed to limit recent searches: \(error)")
        }
        
        save()
    }
    
    func getRecentSearches() -> [String] {
        do {
            var descriptor = FetchDescriptor<RecentSearchHistory>(
                sortBy: [SortDescriptor(\.searchedAt, order: .reverse)]
            )
            descriptor.fetchLimit = 10
            let searches = try modelContext.fetch(descriptor)
            return searches.map { $0.word }
        } catch {
            os_log(.default, "Failed to fetch recent searches: \(error)")
            return []
        }
    }
    
    // MARK: - User Settings
    
    func getSettings() -> UserSettings {
        do {
            let descriptor = FetchDescriptor<UserSettings>()
            if let settings = try modelContext.fetch(descriptor).first {
                return settings
            }
            
            // Create default settings if none exist
            let defaultSettings = UserSettings()
            modelContext.insert(defaultSettings)
            save()
            return defaultSettings
        } catch {
            os_log(.default, "Failed to fetch settings: \(error)")
            // Return default settings on error
            return UserSettings()
        }
    }
    
    func updateSettings(_ updates: [String: Any]) -> UserSettings {
        let settings = getSettings()
        settings.update(from: updates)
        save()
        return settings
    }
}

