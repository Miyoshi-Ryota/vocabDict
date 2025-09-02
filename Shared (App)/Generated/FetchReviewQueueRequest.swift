// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let fetchReviewQueueRequest = try? JSONDecoder().decode(FetchReviewQueueRequest.self, from: jsonData)

import Foundation

/// Request to fetch words due for review.
// MARK: - FetchReviewQueueRequest
struct FetchReviewQueueRequest: Codable {
    /// The action to be performed. Must be 'fetchReviewQueue'.
    let action: Action
    /// Maximum number of words to return in the review queue.
    let maxWords: Int?
}

enum Action: String, Codable {
    case fetchReviewQueue = "fetchReviewQueue"
}
