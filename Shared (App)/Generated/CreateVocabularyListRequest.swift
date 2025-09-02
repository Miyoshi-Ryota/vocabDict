// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let createVocabularyListRequest = try? JSONDecoder().decode(CreateVocabularyListRequest.self, from: jsonData)

import Foundation

/// Request to create a new vocabulary list.
// MARK: - CreateVocabularyListRequest
struct CreateVocabularyListRequest: Codable {
    /// The action to be performed. Must be 'createVocabularyList'.
    let action: Action
    /// Whether this list should be the default list.
    let isDefault: Bool?
    /// The name of the new vocabulary list.
    let name: String
}

enum Action: String, Codable {
    case createVocabularyList = "createVocabularyList"
}
