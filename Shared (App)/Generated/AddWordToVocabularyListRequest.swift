// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let addWordToVocabularyListRequest = try? JSONDecoder().decode(AddWordToVocabularyListRequest.self, from: jsonData)

import Foundation

/// Request to add a word to a vocabulary list. It's used for all of
/// UI->(background)->(SwiftWebExtensionHandler)->SwiftData
// MARK: - AddWordToVocabularyListRequest
struct AddWordToVocabularyListRequest: Codable {
    /// The action to be performed. Must be 'addWordToVocabularyList'.
    let action: Action
    /// The ID of the vocabulary list to which the word will be added.
    let listID: String
    let metadata: Metadata?
    /// The word to be added to the vocabulary list.
    let word: String

    enum CodingKeys: String, CodingKey {
        case action
        case listID = "listId"
        case metadata, word
    }
}

enum Action: String, Codable {
    case addWordToVocabularyList = "addWordToVocabularyList"
}

// MARK: - Metadata
struct Metadata: Codable {
    /// Word frequency value (1 to ~330000)
    let difficulty: Int?
}
