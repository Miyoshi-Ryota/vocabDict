//
//  VocabularyList.swift
//  vocabDict
//
//  Created for CloudKit sync implementation
//

import SwiftData
import Foundation

@Model
final class VocabularyList {
    var id: UUID = UUID()
    var name: String = ""
    var created: Date = Date()
    var isDefault: Bool = false
    var lastModified: Date = Date()
    
    @Relationship(deleteRule: .cascade)
    var words: [Word]? = []
    
    init(name: String, isDefault: Bool = false) {
        self.name = name
        self.isDefault = isDefault
        self.lastModified = Date()
    }
}