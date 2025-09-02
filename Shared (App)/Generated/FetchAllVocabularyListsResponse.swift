// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchAllVocabularyListsResponse = try? JSONDecoder().decode(FetchAllVocabularyListsResponse.self, from: jsonData)

import Foundation

/// Response containing all vocabulary lists.
// MARK: - FetchAllVocabularyListsResponse
struct FetchAllVocabularyListsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the fetch was successful.
    let success: Bool
    /// Array of vocabulary lists.
    let vocabularyLists: [VocabularyList]?
}

// MARK: - VocabularyList
struct VocabularyList: Codable {
    let createdAt: Date?
    let id: String?
    let isDefault: Bool?
    let name: String?
    let updatedAt: Date?
    let wordCount: Int?
}
