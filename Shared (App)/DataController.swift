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
            // Debug: Check if App Group is accessible
            guard let appGroupURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: "group.com.vocabdict.shared"
            ) else {
                fatalError("App Group container URL not found. Check entitlements for group.com.vocabdict.shared")
            }
            
            print("App Group URL: \(appGroupURL)")
            
            // Create directory if needed
            try FileManager.default.createDirectory(at: appGroupURL, withIntermediateDirectories: true)
            
            let storeURL = appGroupURL.appendingPathComponent("VocabDict.store")
            print("Store URL: \(storeURL)")
            
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
            print("DataController initialized successfully")
            
        } catch {
            print("Error type: \(type(of: error))")
            print("Error description: \(error)")
            print("Error localized: \(error.localizedDescription)")
            if let nsError = error as NSError? {
                print("Error domain: \(nsError.domain)")
                print("Error code: \(nsError.code)")
                print("Error userInfo: \(nsError.userInfo)")
            }
            fatalError("Could not create ModelContainer: \(error)")
        }
    }
    
    func save() {
        do {
            try modelContext.save()
        } catch {
            print("Failed to save context: \(error)")
        }
    }
}