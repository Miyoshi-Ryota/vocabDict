// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let submitReviewRequest = try? JSONDecoder().decode(SubmitReviewRequest.self, from: jsonData)

import Foundation

/// Request to submit a review result for a word.
// MARK: - SubmitReviewRequest
struct SubmitReviewRequest: Codable {
    /// The action to be performed. Must be 'submitReview'.
    let action: Action
    /// The ID of the vocabulary list containing the word.
    let listID: String
    /// The review result indicating how well the user knew the word.
    let reviewResult: ReviewResult
    /// Time spent on the review in seconds.
    let timeSpent: Double?
    /// The word being reviewed.
    let word: String

    enum CodingKeys: String, CodingKey {
        case action
        case listID = "listId"
        case reviewResult, timeSpent, word
    }
}

enum Action: String, Codable {
    case submitReview = "submitReview"
}

/// The review result indicating how well the user knew the word.
enum ReviewResult: String, Codable {
    case bad = "bad"
    case good = "good"
    case ok = "ok"
}
