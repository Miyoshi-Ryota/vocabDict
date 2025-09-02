// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchRecentSearchesResponse = try? JSONDecoder().decode(FetchRecentSearchesResponse.self, from: jsonData)

import Foundation

/// Response containing recent searches.
// MARK: - FetchRecentSearchesResponse
struct FetchRecentSearchesResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Array of recent search words.
    let recentSearches: [String]?
    /// Whether the fetch was successful.
    let success: Bool
}
