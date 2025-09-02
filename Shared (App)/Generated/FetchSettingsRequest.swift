// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchSettingsRequest = try? JSONDecoder().decode(FetchSettingsRequest.self, from: jsonData)

import Foundation

/// Request to fetch user settings.
// MARK: - FetchSettingsRequest
struct FetchSettingsRequest: Codable {
    /// The action to be performed. Must be 'fetchSettings'.
    let action: Action
}

enum Action: String, Codable {
    case fetchSettings = "fetchSettings"
}
