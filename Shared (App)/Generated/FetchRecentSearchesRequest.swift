// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchRecentSearchesRequest = try? JSONDecoder().decode(FetchRecentSearchesRequest.self, from: jsonData)

import Foundation

/// Request to fetch recent searches.
// MARK: - FetchRecentSearchesRequest
struct FetchRecentSearchesRequest: Codable {
    /// The action to be performed. Must be 'fetchRecentSearches'.
    let action: Action
    /// Maximum number of recent searches to return.
    let limit: Int?
}

enum Action: String, Codable {
    case fetchRecentSearches = "fetchRecentSearches"
}
