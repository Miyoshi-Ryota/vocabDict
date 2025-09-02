// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let updateSettingsResponse = try? JSONDecoder().decode(UpdateSettingsResponse.self, from: jsonData)

import Foundation

/// Response from updating user settings.
// MARK: - UpdateSettingsResponse
struct UpdateSettingsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Updated settings.
    let settings: Settings?
    /// Whether the settings were successfully updated.
    let success: Bool
}

/// Updated settings.
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
