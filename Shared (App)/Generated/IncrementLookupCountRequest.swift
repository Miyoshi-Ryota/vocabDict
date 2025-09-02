// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let incrementLookupCountRequest = try? JSONDecoder().decode(IncrementLookupCountRequest.self, from: jsonData)

import Foundation

/// Request to increment the lookup count for a word.
// MARK: - IncrementLookupCountRequest
struct IncrementLookupCountRequest: Codable {
    /// The action to be performed. Must be 'incrementLookupCount'.
    let action: Action
    /// The word whose lookup count should be incremented.
    let word: String
}

enum Action: String, Codable {
    case incrementLookupCount = "incrementLookupCount"
}
