//
//  Models.swift
//  vocabDict
//
//  Created by Ryota Miyoshi on 2025/8/21.
//

import SwiftData
import Foundation

final class UserSpecificData: Codable {
    var word: String
    var dateAdded: Date
    var difficulty: Int
    var customNotes: String
    var lastReviewed: Date?
    var nextReview: Date
    var reviewHistory: [ReviewHistoryEntry]
    
    init(word: String, dateAdded: Date = Date(), difficulty: Int = 5000, customNotes: String = "", lastReviewed: Date? = nil, nextReview: Date = Date(timeIntervalSinceNow: 86400), reviewHistory: [ReviewHistoryEntry] = []) {
        self.word = word
        self.dateAdded = dateAdded
        self.difficulty = difficulty
        self.customNotes = customNotes
        self.lastReviewed = lastReviewed
        self.nextReview = nextReview
        self.reviewHistory = reviewHistory
    }
    
    func toDictionary() -> [String: Any] {
        let formatter = ISO8601DateFormatter()
        return [
            "word": word,
            "dateAdded": formatter.string(from: dateAdded),
            "difficulty": difficulty,
            "customNotes": customNotes,
            "lastReviewed": lastReviewed != nil ? formatter.string(from: lastReviewed!) : NSNull(),
            "nextReview": formatter.string(from: nextReview),
            "reviewHistory": reviewHistory.map { $0.toDictionary() }
        ]
    }
}

final class ReviewHistoryEntry: Codable {
    var date: Date
    var result: String
    var timeSpent: Double // in seconds

    init(date: Date, result: String, timeSpent: Double) {
        self.date = date
        self.result = result
        self.timeSpent = timeSpent
    }
    
    func toDictionary() -> [String: Any] {
        return [
            "date": ISO8601DateFormatter().string(from: date),
            "result": result,
            "timeSpent": timeSpent
        ]
    }
}

@Model
final class RecentSearchHistory {
    var id: UUID = UUID()
    var word: String = ""
    var searchedAt: Date = Date()
    
    init(id: UUID = UUID(), word: String = "", searchedAt: Date = Date()) {
        self.id = id
        self.word = word
        self.searchedAt = searchedAt
    }
    
    func toDictionary() -> [String: Any] {
        return [
            "id": id.uuidString,
            "word": word,
            "searchedAt": ISO8601DateFormatter().string(from: searchedAt)
        ]
    }
}

@Model
final class DictionaryLookupStats {
    var id: UUID = UUID()
    var word: String = ""
    var count: Int = 0
    var firstLookup: Date = Date()
    var lastLookup: Date = Date()
    
    init(id: UUID = UUID(), word: String = "", count: Int = 0, firstLookup: Date = Date(), lastLookup: Date = Date()) {
        self.id = id
        self.word = word
        self.count = count
        self.firstLookup = firstLookup
        self.lastLookup = lastLookup
    }
    
    func toDictionary() -> [String: Any] {
        let formatter = ISO8601DateFormatter()
        return [
            "word": word,
            "count": count,
            "firstLookup": formatter.string(from: firstLookup),
            "lastLookup": formatter.string(from: lastLookup)
        ]
    }
}

@Model
final class UserSettings {
    var id: UUID = UUID()
    var theme: String = "dark"
    var autoPlayPronunciation: Bool = false
    var showExampleSentences: Bool = true
    var textSelectionMode: String = "inline"
    var autoAddLookups: Bool = false
    
    init(id: UUID = UUID(), 
         theme: String = "dark",
         autoPlayPronunciation: Bool = false,
         showExampleSentences: Bool = true,
         textSelectionMode: String = "inline",
         autoAddLookups: Bool = false) {
        self.id = id
        self.theme = theme
        self.autoPlayPronunciation = autoPlayPronunciation
        self.showExampleSentences = showExampleSentences
        self.textSelectionMode = textSelectionMode
        self.autoAddLookups = autoAddLookups
    }
    
    func toDictionary() -> [String: Any] {
        return [
            "theme": theme,
            "autoPlayPronunciation": autoPlayPronunciation,
            "showExampleSentences": showExampleSentences,
            "textSelectionMode": textSelectionMode,
            "autoAddLookups": autoAddLookups
        ]
    }
    
    func update(from dict: [String: Any]) {
        if let theme = dict["theme"] as? String {
            self.theme = theme
        }
        if let autoPlay = dict["autoPlayPronunciation"] as? Bool {
            self.autoPlayPronunciation = autoPlay
        }
        if let showExamples = dict["showExampleSentences"] as? Bool {
            self.showExampleSentences = showExamples
        }
        if let textMode = dict["textSelectionMode"] as? String {
            self.textSelectionMode = textMode
        }
        if let autoAdd = dict["autoAddLookups"] as? Bool {
            self.autoAddLookups = autoAdd
        }
    }
}

@Model
final class VocabularyList {
    var id: UUID = UUID()
    var name: String = ""
    var created: Date = Date()
    var isDefault: Bool = false
    var words: [String: UserSpecificData] = [:] // Key: word (lowercase), Value: user-specific data

    init(id: UUID = UUID(), name: String = "", created: Date = Date(), isDefault: Bool = false, words: [String: UserSpecificData] = [:]) {
        self.id = id
        self.name = name
        self.created = created
        self.isDefault = isDefault
        self.words = words
    }
    
    func toDictionary() -> [String: Any] {
        return [
            "id": id.uuidString,
            "name": name,
            "createdAt": ISO8601DateFormatter().string(from: created),
            "isDefault": isDefault,
            "words": words.mapValues { $0.toDictionary() }
        ]
    }
}
