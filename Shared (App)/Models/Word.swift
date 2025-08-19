//
//  Word.swift
//  vocabDict
//
//  Created for CloudKit sync implementation
//

import SwiftData
import Foundation

@Model
final class Word {
    var id: UUID = UUID()
    var normalizedWord: String = ""
    var word: String = ""
    var dateAdded: Date = Date()
    var difficulty: String = "medium"
    var customNotes: String = ""
    var lastReviewed: Date?
    var nextReview: Date = Date(timeIntervalSinceNow: 86400)
    var lastModified: Date = Date()
    
    @Relationship(deleteRule: .cascade)
    var reviewHistory: [ReviewHistory]? = []
    
    @Relationship(inverse: \VocabularyList.words)
    var list: VocabularyList?
    
    init(word: String, normalizedWord: String? = nil) {
        self.word = word
        self.normalizedWord = normalizedWord ?? word.lowercased().trimmingCharacters(in: .whitespaces)
        self.lastModified = Date()
    }
}