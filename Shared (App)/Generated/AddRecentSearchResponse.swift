// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let addRecentSearchResponse = try? JSONDecoder().decode(AddRecentSearchResponse.self, from: jsonData)

import Foundation

/// Response from adding a word to recent searches.
// MARK: - AddRecentSearchResponse
struct AddRecentSearchResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the word was successfully added to recent searches.
    let success: Bool
}
