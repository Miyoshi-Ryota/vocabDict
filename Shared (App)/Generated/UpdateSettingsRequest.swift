// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let updateSettingsRequest = try? JSONDecoder().decode(UpdateSettingsRequest.self, from: jsonData)

import Foundation

/// Request to update user settings.
// MARK: - UpdateSettingsRequest
struct UpdateSettingsRequest: Codable {
    /// The action to be performed. Must be 'updateSettings'.
    let action: Action
    /// Settings to update.
    let settings: Settings
}

enum Action: String, Codable {
    case updateSettings = "updateSettings"
}

/// Settings to update.
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
