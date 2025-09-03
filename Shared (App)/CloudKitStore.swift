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
    
    func addWordToVocabularyList(word: String, metadata: [String: Any], to vocabularyListId: UUID) -> UserSpecificData? {
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
        let difficulty: Int
        if let diff = metadata["difficulty"] as? Int {
            difficulty = diff
        } else if let diffStr = metadata["difficulty"] as? String,
                  let diffInt = Int(diffStr) {
            difficulty = diffInt
        } else {
            difficulty = 5000 // Default medium difficulty
        }
        
        let userData = UserSpecificData(
            word: word,
            dateAdded: Date(),
            difficulty: difficulty,
            customNotes: (metadata["customNotes"] as? String) ?? "",
            lastReviewed: nil,
            nextReview: Date(timeIntervalSinceNow: 86400),  // Tomorrow
            reviewHistory: []
        )
        
        vocabularyList.words[normalizedWord] = userData
        save()
        return userData
    }
    
    func updateWord(word: String, updates: [String: Any], in vocabularyListId: UUID) -> UserSpecificData? {
        os_log(.default, "[DEBUG] updateWord called - word: %{public}@, listId: %{public}@", word, vocabularyListId.uuidString)
        os_log(.default, "[DEBUG] updateWord - raw updates: %{public}@", String(describing: updates))
        
        guard let vocabularyList = getVocabularyList(id: vocabularyListId) else {
            os_log(.default, "[DEBUG] Vocabulary list with ID %{public}@ not found", vocabularyListId.uuidString)
            return nil
        }
        
        let normalizedWord = word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        guard let wordData = vocabularyList.words[normalizedWord] else {
            os_log(.default, "[DEBUG] Word '%{public}@' not found in list", normalizedWord)
            return nil
        }
        
        os_log(.default, "[DEBUG] Found word data for '%{public}@'", normalizedWord)
        
        // Update fields
        if let difficulty = updates["difficulty"] as? Int {
            wordData.difficulty = difficulty
        } else if let difficultyString = updates["difficulty"] as? String,
                  let difficultyInt = Int(difficultyString) {
            wordData.difficulty = difficultyInt
        }
        if let customNotes = updates["customNotes"] as? String {
            wordData.customNotes = customNotes
        }
        if let lastReviewedStr = updates["lastReviewed"] as? String {
            wordData.lastReviewed = ISO8601DateFormatter().date(from: lastReviewedStr)
        }
        if let nextReviewStr = updates["nextReview"] as? String {
            wordData.nextReview = ISO8601DateFormatter().date(from: nextReviewStr) ?? Date()
        } else if updates["nextReview"] is NSNull {
            // Handle mastered words (nextReview set to null)
            wordData.nextReview = Date.distantFuture
        }
        if let reviewHistory = updates["reviewHistory"] as? [[String: Any]] {
            wordData.reviewHistory = reviewHistory.compactMap { entry in
                guard let dateStr = entry["date"] as? String,
                      let date = ISO8601DateFormatter().date(from: dateStr),
                      let result = entry["result"] as? String else {
                    return nil
                }
                
                // Handle timeSpent as either Int or Double
                var timeSpent: Double = 0
                if let timeSpentDouble = entry["timeSpent"] as? Double {
                    timeSpent = timeSpentDouble
                } else if let timeSpentInt = entry["timeSpent"] as? Int {
                    timeSpent = Double(timeSpentInt)
                }
                
                return ReviewHistoryEntry(date: date, result: result, timeSpent: timeSpent)
            }
        }
        
        save()
        return wordData
    }
    
    // MARK: - Spaced Repetition Logic
    
    private let intervalProgression: [Int: Int] = [
        1: 3,
        3: 7,
        7: 14,
        14: 30,
        30: 60
    ]
    
    private func calculateNextInterval(currentInterval: Int, result: String) -> Int? {
        switch result {
        case "mastered":
            return nil  // Remove from review queue
        case "unknown":
            return 1    // Reset to day 1
        case "known":
            return intervalProgression[currentInterval] ?? currentInterval * 2
        case "skipped":
            return currentInterval  // No change
        default:
            return currentInterval
        }
    }
    
    private func getCurrentInterval(lastReviewed: Date?) -> Int {
        guard let lastReviewed = lastReviewed else {
            return 1  // New word, start at interval 1
        }
        
        let daysSinceLastReview = Calendar.current.dateComponents(
            [.day], 
            from: lastReviewed, 
            to: Date()
        ).day ?? 0
        
        return max(1, daysSinceLastReview)
    }
    
    func submitReview(word: String, result: String, timeSpent: Double, in vocabularyListId: UUID) -> [String: Any] {
        guard let vocabularyList = getVocabularyList(id: vocabularyListId) else {
            os_log(.default, "Vocabulary list with ID %{public}@ not found", vocabularyListId.uuidString)
            return ["error": "Vocabulary list not found"]
        }
        
        let normalizedWord = word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        guard let wordData = vocabularyList.words[normalizedWord] else {
            os_log(.default, "Word '%{public}@' not found in list", normalizedWord)
            return ["error": "Word not found in list"]
        }
        
        // Calculate intervals
        let currentInterval = getCurrentInterval(lastReviewed: wordData.lastReviewed)
        let nextInterval = calculateNextInterval(currentInterval: currentInterval, result: result)
        
        // Create new review history entry
        let reviewEntry = ReviewHistoryEntry(
            date: Date(),
            result: result,
            timeSpent: timeSpent
        )
        
        // Calculate next review date
        let nextReviewDate: Date
        if let nextInterval = nextInterval {
            nextReviewDate = Calendar.current.date(
                byAdding: .day,
                value: nextInterval,
                to: Date()
            ) ?? Date()
        } else {
            // Mastered - set to distant future
            nextReviewDate = Date.distantFuture
        }
        
        // Create new UserSpecificData object for proper change detection
        let updatedWordData = UserSpecificData(
            word: wordData.word,
            dateAdded: wordData.dateAdded,
            difficulty: wordData.difficulty,
            customNotes: wordData.customNotes,
            lastReviewed: Date(),
            nextReview: nextReviewDate,
            reviewHistory: wordData.reviewHistory + [reviewEntry]
        )
        
        // Replace the old object with the new one
        vocabularyList.words[normalizedWord] = updatedWordData
        
        save()
        
        // Return response with calculated interval
        return [
            "success": true,
            "data": [
                "nextInterval": nextInterval as Any,
                "nextReview": ISO8601DateFormatter().string(from: updatedWordData.nextReview),
                "word": updatedWordData.toDictionary()
            ]
        ]
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
    
    // MARK: - Dictionary Lookup Stats
    
    func incrementLookupCount(for word: String) {
        let normalizedWord = word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        do {
            let predicate = #Predicate<DictionaryLookupStats> { stats in
                stats.word == normalizedWord
            }
            let descriptor = FetchDescriptor(predicate: predicate)
            
            if let existingStats = try modelContext.fetch(descriptor).first {
                // Update existing stats
                existingStats.count += 1
                existingStats.lastLookup = Date()
            } else {
                // Create new stats entry
                let newStats = DictionaryLookupStats(
                    word: normalizedWord,
                    count: 1,
                    firstLookup: Date(),
                    lastLookup: Date()
                )
                modelContext.insert(newStats)
            }
            
            save()
        } catch {
            os_log(.default, "Failed to increment lookup count: \(error)")
        }
    }
    
    func getLookupStats() -> [String: [String: Any]] {
        do {
            let descriptor = FetchDescriptor<DictionaryLookupStats>()
            let allStats = try modelContext.fetch(descriptor)
            
            var statsDict: [String: [String: Any]] = [:]
            for stat in allStats {
                statsDict[stat.word] = stat.toDictionary()
            }
            
            return statsDict
        } catch {
            os_log(.default, "Failed to fetch lookup stats: \(error)")
            return [:]
        }
    }
    
    func getLookupCount(for word: String) -> Int {
        let normalizedWord = word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        do {
            let predicate = #Predicate<DictionaryLookupStats> { stats in
                stats.word == normalizedWord
            }
            let descriptor = FetchDescriptor(predicate: predicate)
            
            if let stats = try modelContext.fetch(descriptor).first {
                return stats.count
            }
            
            return 0
        } catch {
            os_log(.default, "Failed to get lookup count: \(error)")
            return 0
        }
    }
}

