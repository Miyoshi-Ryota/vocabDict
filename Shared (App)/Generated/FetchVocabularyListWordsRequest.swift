// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchVocabularyListWordsRequest = try? JSONDecoder().decode(FetchVocabularyListWordsRequest.self, from: jsonData)

import Foundation

/// Request to fetch words from a specific vocabulary list.
// MARK: - FetchVocabularyListWordsRequest
struct FetchVocabularyListWordsRequest: Codable {
    /// The action to be performed. Must be 'fetchVocabularyListWords'.
    let action: Action
    /// Filter words by difficulty level.
    let filterBy: FilterBy?
    /// The ID of the vocabulary list to fetch words from.
    let listID: String
    /// Sort words by specified criteria.
    let sortBy: SortBy?
    /// Sort order (ascending or descending).
    let sortOrder: SortOrder?

    enum CodingKeys: String, CodingKey {
        case action, filterBy
        case listID = "listId"
        case sortBy, sortOrder
    }
}

enum Action: String, Codable {
    case fetchVocabularyListWords = "fetchVocabularyListWords"
}

/// Filter words by difficulty level.
enum FilterBy: String, Codable {
    case all = "all"
    case easy = "easy"
    case hard = "hard"
    case medium = "medium"
}

/// Sort words by specified criteria.
enum SortBy: String, Codable {
    case alphabetical = "alphabetical"
    case date = "date"
    case difficulty = "difficulty"
    case frequency = "frequency"
}

/// Sort order (ascending or descending).
enum SortOrder: String, Codable {
    case asc = "asc"
    case desc = "desc"
}
