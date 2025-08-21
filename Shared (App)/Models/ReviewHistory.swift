//
//  ReviewHistory.swift
//  vocabDict
//
//  Created for CloudKit sync implementation
//

import SwiftData
import Foundation

@Model
final class ReviewHistory {
    var id: UUID = UUID()
    var date: Date = Date()
    var result: String = ""
    var timeSpent: Int = 0
    
    @Relationship(inverse: \Word.reviewHistory)
    var word: Word?
    
    init(result: String, timeSpent: Int) {
        self.result = result
        self.timeSpent = timeSpent
    }
}