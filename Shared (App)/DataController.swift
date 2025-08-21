//
//  DataController.swift
//  vocabDict
//
//  Created for CloudKit sync implementation
//

import SwiftData
import Foundation
import CloudKit

class DataController {
    static let shared = DataController()
    
    let modelContainer: ModelContainer
    let modelContext: ModelContext
    
    private init() {
        do {
            guard let appGroupURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: "group.com.vocabdict.shared"
            ) else {
                fatalError("App Group container URL not found")
            }
            
            try FileManager.default.createDirectory(at: appGroupURL, withIntermediateDirectories: true)
            
            let storeURL = appGroupURL.appendingPathComponent("VocabDict.store")
            
            let schema = Schema([
                VocabularyList.self,
                Word.self,
                ReviewHistory.self,
                Settings.self,
                ReviewSession.self
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
            print("Failed to save context: \(error)")
        }
    }
}