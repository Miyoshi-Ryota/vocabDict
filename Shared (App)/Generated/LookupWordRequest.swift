// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let lookupWordRequest = try? JSONDecoder().decode(LookupWordRequest.self, from: jsonData)

import Foundation

/// Request to lookup a word in the dictionary.
// MARK: - LookupWordRequest
struct LookupWordRequest: Codable {
    /// The action to be performed. Must be 'lookupWord'.
    let action: Action
    /// The word to lookup in the dictionary.
    let word: String
}

enum Action: String, Codable {
    case lookupWord = "lookupWord"
}
