//
//  ReviewSession.swift
//  vocabDict
//
//  Created for CloudKit sync implementation
//

import SwiftData
import Foundation

@Model
final class ReviewSession {
    var id: UUID = UUID()
    var startTime: Date = Date()
    var endTime: Date?
    var wordsReviewed: Int = 0
    var currentWordIndex: Int = 0
    var lastModified: Date = Date()
    
    @Relationship
    var sessionWords: [Word]? = []
    
    init() {
        self.lastModified = Date()
    }
}