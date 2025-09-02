// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let createVocabularyListResponse = try? JSONDecoder().decode(CreateVocabularyListResponse.self, from: jsonData)

import Foundation

/// Response from creating a new vocabulary list.
// MARK: - CreateVocabularyListResponse
struct CreateVocabularyListResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the list was successfully created.
    let success: Bool
    /// The created vocabulary list.
    let vocabularyList: VocabularyList?
}

/// The created vocabulary list.
// MARK: - VocabularyList
struct VocabularyList: Codable {
    let createdAt: Date?
    let id: String?
    let isDefault: Bool?
    let name: String?
}
