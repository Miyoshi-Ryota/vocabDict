// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let submitReviewResponse = try? JSONDecoder().decode(SubmitReviewResponse.self, from: jsonData)

import Foundation

/// Response from submitting a review result.
// MARK: - SubmitReviewResponse
struct SubmitReviewResponse: Codable {
    /// Updated word data after review.
    let data: DataClass?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the review was successfully submitted.
    let success: Bool
}

/// Updated word data after review.
// MARK: - DataClass
struct DataClass: Codable {
    /// Ease factor for spaced repetition.
    let easeFactor: Double?
    /// Review interval in days.
    let interval: Int?
    /// Next scheduled review date.
    let nextReview: Date?
    /// Total number of reviews for this word.
    let reviewCount: Int?
    let word: String?
}
