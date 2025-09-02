// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchLookupCountRequest = try? JSONDecoder().decode(FetchLookupCountRequest.self, from: jsonData)

import Foundation

/// Request to fetch the lookup count for a specific word.
// MARK: - FetchLookupCountRequest
struct FetchLookupCountRequest: Codable {
    /// The action to be performed. Must be 'fetchLookupCount'.
    let action: Action
    /// The word to get the lookup count for.
    let word: String
}

enum Action: String, Codable {
    case fetchLookupCount = "fetchLookupCount"
}
