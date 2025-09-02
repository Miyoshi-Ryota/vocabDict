// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let addRecentSearchRequest = try? JSONDecoder().decode(AddRecentSearchRequest.self, from: jsonData)

import Foundation

/// Request to add a word to recent searches.
// MARK: - AddRecentSearchRequest
struct AddRecentSearchRequest: Codable {
    /// The action to be performed. Must be 'addRecentSearch'.
    let action: Action
    /// The word to add to recent searches.
    let word: String
}

enum Action: String, Codable {
    case addRecentSearch = "addRecentSearch"
}
