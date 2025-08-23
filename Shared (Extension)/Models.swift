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
    var difficulty: String
    var customNotes: String
    var lastReviewed: Date?
    var nextReviewDate: Date
    var reviewHistory: [ReviewHistoryEntry]
    
    init(word: String, dateAdded: Date = Date(), difficulty: String = "medium", customNotes: String = "", lastReviewed: Date? = nil, nextReviewDate: Date = Date(timeIntervalSinceNow: 86400), reviewHistory: [ReviewHistoryEntry] = []) {
        self.word = word
        self.dateAdded = dateAdded
        self.difficulty = difficulty
        self.customNotes = customNotes
        self.lastReviewed = lastReviewed
        self.nextReviewDate = nextReviewDate
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
            "nextReviewDate": formatter.string(from: nextReviewDate),
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
            "created": ISO8601DateFormatter().string(from: created),
            "isDefault": isDefault,
            "words": words.mapValues { $0.toDictionary() }
        ]
    }
}
