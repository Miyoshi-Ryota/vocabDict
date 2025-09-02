// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchAllVocabularyListsRequest = try? JSONDecoder().decode(FetchAllVocabularyListsRequest.self, from: jsonData)

import Foundation

/// Request to fetch all vocabulary lists.
// MARK: - FetchAllVocabularyListsRequest
struct FetchAllVocabularyListsRequest: Codable {
    /// The action to be performed. Must be 'fetchAllVocabularyLists'.
    let action: Action
}

enum Action: String, Codable {
    case fetchAllVocabularyLists = "fetchAllVocabularyLists"
}
