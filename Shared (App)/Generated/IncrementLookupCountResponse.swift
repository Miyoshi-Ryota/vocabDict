// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let incrementLookupCountResponse = try? JSONDecoder().decode(IncrementLookupCountResponse.self, from: jsonData)

import Foundation

/// Response from incrementing the lookup count for a word.
// MARK: - IncrementLookupCountResponse
struct IncrementLookupCountResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the lookup count was successfully incremented.
    let success: Bool
}
