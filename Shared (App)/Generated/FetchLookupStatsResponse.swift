// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchLookupStatsResponse = try? JSONDecoder().decode(FetchLookupStatsResponse.self, from: jsonData)

import Foundation

/// Response containing lookup statistics.
// MARK: - FetchLookupStatsResponse
struct FetchLookupStatsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Lookup statistics.
    let stats: Stats?
    /// Whether the fetch was successful.
    let success: Bool
}

/// Lookup statistics.
// MARK: - Stats
struct Stats: Codable {
    let topWords: [TopWord]?
    let totalLookups, uniqueWords: Int?
}

// MARK: - TopWord
struct TopWord: Codable {
    let count: Int?
    let word: String?
}
