// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchSettingsResponse = try? JSONDecoder().decode(FetchSettingsResponse.self, from: jsonData)

import Foundation

/// Response containing user settings.
// MARK: - FetchSettingsResponse
struct FetchSettingsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// User settings.
    let settings: Settings?
    /// Whether the fetch was successful.
    let success: Bool
}

/// User settings.
// MARK: - Settings
struct Settings: Codable {
    let autoPlayPronunciation, showExampleSentences: Bool?
    let textSelectionMode: TextSelectionMode?
    let theme: Theme?
}

enum TextSelectionMode: String, Codable {
    case inline = "inline"
    case popup = "popup"
}

enum Theme: String, Codable {
    case auto = "auto"
    case dark = "dark"
    case light = "light"
}
