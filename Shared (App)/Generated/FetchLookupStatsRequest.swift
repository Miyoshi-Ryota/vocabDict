// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchLookupStatsRequest = try? JSONDecoder().decode(FetchLookupStatsRequest.self, from: jsonData)

import Foundation

/// Request to fetch lookup statistics.
// MARK: - FetchLookupStatsRequest
struct FetchLookupStatsRequest: Codable {
    /// The action to be performed. Must be 'fetchLookupStats'.
    let action: Action
}

enum Action: String, Codable {
    case fetchLookupStats = "fetchLookupStats"
}
