// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchLookupCountResponse = try? JSONDecoder().decode(FetchLookupCountResponse.self, from: jsonData)

import Foundation

/// Response containing the lookup count for a word.
// MARK: - FetchLookupCountResponse
struct FetchLookupCountResponse: Codable {
    /// The number of times the word has been looked up.
    let count: Int?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the fetch was successful.
    let success: Bool
}
