//
//  CloudKit.swift
//  vocabDict
//
//  Created by Ryota Miyoshi on 2025/8/21.
//


import SwiftData
import Foundation
import CloudKit

class CloudKitStore {
    static let shared = CloudKitStore()
    
    let modelContext: ModelContext

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
}
