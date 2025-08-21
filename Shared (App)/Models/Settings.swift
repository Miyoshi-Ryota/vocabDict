//
//  Settings.swift
//  vocabDict
//
//  Created for CloudKit sync implementation
//

import SwiftData
import Foundation

@Model
final class Settings {
    var id: UUID = UUID()
    var theme: String = "dark"
    var autoPlayPronunciation: Bool = false
    var showExampleSentences: Bool = true
    var textSelectionMode: String = "inline"
    var lastModified: Date = Date()
    
    static let singletonID = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
    
    init() {
        self.id = Settings.singletonID
        self.lastModified = Date()
    }
}