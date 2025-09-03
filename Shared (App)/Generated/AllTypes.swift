// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let addRecentSearchRequest = try? JSONDecoder().decode(AddRecentSearchRequest.self, from: jsonData)
//   let addRecentSearchResponse = try? JSONDecoder().decode(AddRecentSearchResponse.self, from: jsonData)
//   let addWordToVocabularyListRequest = try? JSONDecoder().decode(AddWordToVocabularyListRequest.self, from: jsonData)
//   let addWordToVocabularyListResponse = try? JSONDecoder().decode(AddWordToVocabularyListResponse.self, from: jsonData)
//   let createVocabularyListRequest = try? JSONDecoder().decode(CreateVocabularyListRequest.self, from: jsonData)
//   let createVocabularyListResponse = try? JSONDecoder().decode(CreateVocabularyListResponse.self, from: jsonData)
//   let fetchAllVocabularyListsRequest = try? JSONDecoder().decode(FetchAllVocabularyListsRequest.self, from: jsonData)
//   let fetchAllVocabularyListsResponse = try? JSONDecoder().decode(FetchAllVocabularyListsResponse.self, from: jsonData)
//   let fetchLookupCountRequest = try? JSONDecoder().decode(FetchLookupCountRequest.self, from: jsonData)
//   let fetchLookupCountResponse = try? JSONDecoder().decode(FetchLookupCountResponse.self, from: jsonData)
//   let fetchLookupStatsRequest = try? JSONDecoder().decode(FetchLookupStatsRequest.self, from: jsonData)
//   let fetchLookupStatsResponse = try? JSONDecoder().decode(FetchLookupStatsResponse.self, from: jsonData)
//   let fetchRecentSearchesRequest = try? JSONDecoder().decode(FetchRecentSearchesRequest.self, from: jsonData)
//   let fetchRecentSearchesResponse = try? JSONDecoder().decode(FetchRecentSearchesResponse.self, from: jsonData)
//   let fetchReviewQueueRequest = try? JSONDecoder().decode(FetchReviewQueueRequest.self, from: jsonData)
//   let fetchReviewQueueResponse = try? JSONDecoder().decode(FetchReviewQueueResponse.self, from: jsonData)
//   let fetchSettingsRequest = try? JSONDecoder().decode(FetchSettingsRequest.self, from: jsonData)
//   let fetchSettingsResponse = try? JSONDecoder().decode(FetchSettingsResponse.self, from: jsonData)
//   let fetchVocabularyListWordsRequest = try? JSONDecoder().decode(FetchVocabularyListWordsRequest.self, from: jsonData)
//   let fetchVocabularyListWordsResponse = try? JSONDecoder().decode(FetchVocabularyListWordsResponse.self, from: jsonData)
//   let getPendingContextSearchRequest = try? JSONDecoder().decode(GetPendingContextSearchRequest.self, from: jsonData)
//   let getPendingContextSearchResponse = try? JSONDecoder().decode(GetPendingContextSearchResponse.self, from: jsonData)
//   let incrementLookupCountRequest = try? JSONDecoder().decode(IncrementLookupCountRequest.self, from: jsonData)
//   let incrementLookupCountResponse = try? JSONDecoder().decode(IncrementLookupCountResponse.self, from: jsonData)
//   let lookupWordRequest = try? JSONDecoder().decode(LookupWordRequest.self, from: jsonData)
//   let lookupWordResponse = try? JSONDecoder().decode(LookupWordResponse.self, from: jsonData)
//   let openPopupWithWordRequest = try? JSONDecoder().decode(OpenPopupWithWordRequest.self, from: jsonData)
//   let openPopupWithWordResponse = try? JSONDecoder().decode(OpenPopupWithWordResponse.self, from: jsonData)
//   let submitReviewRequest = try? JSONDecoder().decode(SubmitReviewRequest.self, from: jsonData)
//   let submitReviewResponse = try? JSONDecoder().decode(SubmitReviewResponse.self, from: jsonData)
//   let updateSettingsRequest = try? JSONDecoder().decode(UpdateSettingsRequest.self, from: jsonData)
//   let updateSettingsResponse = try? JSONDecoder().decode(UpdateSettingsResponse.self, from: jsonData)
//   let updateWordRequest = try? JSONDecoder().decode(UpdateWordRequest.self, from: jsonData)
//   let updateWordResponse = try? JSONDecoder().decode(UpdateWordResponse.self, from: jsonData)

import Foundation

/// Request to add a word to recent searches.
// MARK: - AddRecentSearchRequest
struct AddRecentSearchRequest: Codable {
    /// The action to be performed. Must be 'addRecentSearch'.
    let action: AddRecentSearchRequestAction
    /// The word to add to recent searches.
    let word: String
}

enum AddRecentSearchRequestAction: String, Codable {
    case addRecentSearch = "addRecentSearch"
}

/// Response from adding a word to recent searches.
// MARK: - AddRecentSearchResponse
struct AddRecentSearchResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the word was successfully added to recent searches.
    let success: Bool
}

/// Request to add a word to a vocabulary list. It's used for all of
/// UI->(background)->(SwiftWebExtensionHandler)->SwiftData
// MARK: - AddWordToVocabularyListRequest
struct AddWordToVocabularyListRequest: Codable {
    /// The action to be performed. Must be 'addWordToVocabularyList'.
    let action: AddWordToVocabularyListRequestAction
    /// The ID of the vocabulary list to which the word will be added.
    let listID: String
    let metadata: Metadata?
    /// The word to be added to the vocabulary list.
    let word: String

    enum CodingKeys: String, CodingKey {
        case action
        case listID = "listId"
        case metadata, word
    }
}

enum AddWordToVocabularyListRequestAction: String, Codable {
    case addWordToVocabularyList = "addWordToVocabularyList"
}

// MARK: - Metadata
struct Metadata: Codable {
    /// Custom notes about the word
    let customNotes: String?
    /// Word frequency value (1 to ~330000)
    let difficulty: Int?
}

/// Response from adding a word to a vocabulary list.
// MARK: - AddWordToVocabularyListResponse
struct AddWordToVocabularyListResponse: Codable {
    /// The user-specific word entry as stored.
    let data: AddWordToVocabularyListResponseData?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the word was successfully added.
    let success: Bool
}

/// The user-specific word entry as stored.
// MARK: - AddWordToVocabularyListResponseData
struct AddWordToVocabularyListResponseData: Codable {
    let customNotes: String?
    let dateAdded: Date?
    let difficulty: Int?
    let lastReviewed: Date?
    let nextReview: Date?
    let reviewHistory: [DataReviewHistory]?
    let word: String?
}

// MARK: - DataReviewHistory
struct DataReviewHistory: Codable {
    let date: Date?
    let result: String?
    let timeSpent: Double?
}

/// Request to create a new vocabulary list.
// MARK: - CreateVocabularyListRequest
struct CreateVocabularyListRequest: Codable {
    /// The action to be performed. Must be 'createVocabularyList'.
    let action: CreateVocabularyListRequestAction
    /// Whether this list should be the default list.
    let isDefault: Bool?
    /// The name of the new vocabulary list.
    let name: String
}

enum CreateVocabularyListRequestAction: String, Codable {
    case createVocabularyList = "createVocabularyList"
}

/// Response from creating a new vocabulary list.
// MARK: - CreateVocabularyListResponse
struct CreateVocabularyListResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the list was successfully created.
    let success: Bool
    /// The created vocabulary list.
    let vocabularyList: CreateVocabularyListResponseVocabularyList?
}

/// The created vocabulary list.
// MARK: - CreateVocabularyListResponseVocabularyList
struct CreateVocabularyListResponseVocabularyList: Codable {
    let createdAt: Date?
    let id: String?
    let isDefault: Bool?
    let name: String?
}

/// Request to fetch all vocabulary lists.
// MARK: - FetchAllVocabularyListsRequest
struct FetchAllVocabularyListsRequest: Codable {
    /// The action to be performed. Must be 'fetchAllVocabularyLists'.
    let action: FetchAllVocabularyListsRequestAction
}

enum FetchAllVocabularyListsRequestAction: String, Codable {
    case fetchAllVocabularyLists = "fetchAllVocabularyLists"
}

/// Response containing all vocabulary lists.
// MARK: - FetchAllVocabularyListsResponse
struct FetchAllVocabularyListsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the fetch was successful.
    let success: Bool
    /// Array of vocabulary lists.
    let vocabularyLists: [VocabularyListElement]?
}

// MARK: - VocabularyListElement
struct VocabularyListElement: Codable {
    let createdAt: Date?
    let id: String?
    let isDefault: Bool?
    let name: String?
    let words: [String: WordValue]?
}

// MARK: - WordValue
struct WordValue: Codable {
    let customNotes: String?
    let dateAdded: Date?
    let difficulty: Int?
    let lastReviewed: Date?
    let nextReview: Date?
    let reviewHistory: [ReviewHistoryElement]?
    let word: String?
}

// MARK: - ReviewHistoryElement
struct ReviewHistoryElement: Codable {
    let date: Date?
    let result: String?
    let timeSpent: Double?
}

/// Request to fetch the lookup count for a specific word.
// MARK: - FetchLookupCountRequest
struct FetchLookupCountRequest: Codable {
    /// The action to be performed. Must be 'fetchLookupCount'.
    let action: FetchLookupCountRequestAction
    /// The word to get the lookup count for.
    let word: String
}

enum FetchLookupCountRequestAction: String, Codable {
    case fetchLookupCount = "fetchLookupCount"
}

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

/// Request to fetch lookup statistics.
// MARK: - FetchLookupStatsRequest
struct FetchLookupStatsRequest: Codable {
    /// The action to be performed. Must be 'fetchLookupStats'.
    let action: FetchLookupStatsRequestAction
}

enum FetchLookupStatsRequestAction: String, Codable {
    case fetchLookupStats = "fetchLookupStats"
}

/// Response containing lookup statistics.
// MARK: - FetchLookupStatsResponse
struct FetchLookupStatsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Lookup statistics by word.
    let stats: [String: Stat]?
    /// Whether the fetch was successful.
    let success: Bool
}

// MARK: - Stat
struct Stat: Codable {
    let count: Int?
    let firstLookup, lastLookup: Date?
    let word: String?
}

/// Request to fetch recent searches.
// MARK: - FetchRecentSearchesRequest
struct FetchRecentSearchesRequest: Codable {
    /// The action to be performed. Must be 'fetchRecentSearches'.
    let action: FetchRecentSearchesRequestAction
    /// Maximum number of recent searches to return.
    let limit: Int?
}

enum FetchRecentSearchesRequestAction: String, Codable {
    case fetchRecentSearches = "fetchRecentSearches"
}

/// Response containing recent searches.
// MARK: - FetchRecentSearchesResponse
struct FetchRecentSearchesResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Array of recent search words.
    let recentSearches: [String]?
    /// Whether the fetch was successful.
    let success: Bool
}

/// Request to fetch words due for review.
// MARK: - FetchReviewQueueRequest
struct FetchReviewQueueRequest: Codable {
    /// The action to be performed. Must be 'fetchReviewQueue'.
    let action: FetchReviewQueueRequestAction
    /// Maximum number of words to return in the review queue.
    let maxWords: Int?
}

enum FetchReviewQueueRequestAction: String, Codable {
    case fetchReviewQueue = "fetchReviewQueue"
}

/// Response containing words due for review.
// MARK: - FetchReviewQueueResponse
struct FetchReviewQueueResponse: Codable {
    /// Array of words due for review.
    let data: [FetchReviewQueueResponseDatum]?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the fetch was successful.
    let success: Bool
}

// MARK: - FetchReviewQueueResponseDatum
struct FetchReviewQueueResponseDatum: Codable {
    /// Word difficulty (frequency) as an integer
    let difficulty: Int?
    let listID, listName: String?
    let nextReview: Date?
    let word: String?

    enum CodingKeys: String, CodingKey {
        case difficulty
        case listID = "listId"
        case listName, nextReview, word
    }
}

/// Request to fetch user settings.
// MARK: - FetchSettingsRequest
struct FetchSettingsRequest: Codable {
    /// The action to be performed. Must be 'fetchSettings'.
    let action: FetchSettingsRequestAction
}

enum FetchSettingsRequestAction: String, Codable {
    case fetchSettings = "fetchSettings"
}

/// Response containing user settings.
// MARK: - FetchSettingsResponse
struct FetchSettingsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// User settings.
    let settings: FetchSettingsResponseSettings?
    /// Whether the fetch was successful.
    let success: Bool
}

/// User settings.
// MARK: - FetchSettingsResponseSettings
struct FetchSettingsResponseSettings: Codable {
    let autoAddLookups, autoPlayPronunciation, showExampleSentences: Bool?
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

/// Request to fetch words from a specific vocabulary list.
// MARK: - FetchVocabularyListWordsRequest
struct FetchVocabularyListWordsRequest: Codable {
    /// The action to be performed. Must be 'fetchVocabularyListWords'.
    let action: FetchVocabularyListWordsRequestAction
    /// Filter words by difficulty level.
    let filterBy: FilterBy?
    /// The ID of the vocabulary list to fetch words from.
    let listID: String
    /// Sort words by specified criteria.
    let sortBy: SortBy?
    /// Sort order (ascending or descending).
    let sortOrder: SortOrder?

    enum CodingKeys: String, CodingKey {
        case action, filterBy
        case listID = "listId"
        case sortBy, sortOrder
    }
}

enum FetchVocabularyListWordsRequestAction: String, Codable {
    case fetchVocabularyListWords = "fetchVocabularyListWords"
}

/// Filter words by difficulty level.
enum FilterBy: String, Codable {
    case all = "all"
    case easy = "easy"
    case hard = "hard"
    case medium = "medium"
}

/// Sort words by specified criteria.
enum SortBy: String, Codable {
    case alphabetical = "alphabetical"
    case dateAdded = "dateAdded"
    case difficulty = "difficulty"
    case lastReviewed = "lastReviewed"
    case lookupCount = "lookupCount"
}

/// Sort order (ascending or descending).
enum SortOrder: String, Codable {
    case asc = "asc"
    case desc = "desc"
}

/// Response containing words from a vocabulary list.
// MARK: - FetchVocabularyListWordsResponse
struct FetchVocabularyListWordsResponse: Codable {
    /// Array of word entries.
    let data: [FetchVocabularyListWordsResponseDatum]?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the fetch was successful.
    let success: Bool
}

// MARK: - FetchVocabularyListWordsResponseDatum
struct FetchVocabularyListWordsResponseDatum: Codable {
    let customNotes: String?
    let dateAdded: Date?
    let difficulty: Int?
    let lastReviewed: Date?
    let lookupCount: Int?
    let nextReview: Date?
    let reviewHistory: [DatumReviewHistory]?
    let word: String?
}

// MARK: - DatumReviewHistory
struct DatumReviewHistory: Codable {
    let date: Date?
    let result: String?
    let timeSpent: Double?
}

/// Request to retrieve a pending word selection to search when opening popup.
// MARK: - GetPendingContextSearchRequest
struct GetPendingContextSearchRequest: Codable {
    let action: GetPendingContextSearchRequestAction
}

enum GetPendingContextSearchRequestAction: String, Codable {
    case getPendingContextSearch = "getPendingContextSearch"
}

/// Response containing a pending word for context search, if any.
// MARK: - GetPendingContextSearchResponse
struct GetPendingContextSearchResponse: Codable {
    let data: String?
    let error: String?
    let success: Bool
}

/// Request to increment the lookup count for a word.
// MARK: - IncrementLookupCountRequest
struct IncrementLookupCountRequest: Codable {
    /// The action to be performed. Must be 'incrementLookupCount'.
    let action: IncrementLookupCountRequestAction
    /// The word whose lookup count should be incremented.
    let word: String
}

enum IncrementLookupCountRequestAction: String, Codable {
    case incrementLookupCount = "incrementLookupCount"
}

/// Response from incrementing the lookup count for a word.
// MARK: - IncrementLookupCountResponse
struct IncrementLookupCountResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the lookup count was successfully incremented.
    let success: Bool
}

/// Request to lookup a word in the dictionary.
// MARK: - LookupWordRequest
struct LookupWordRequest: Codable {
    /// The action to be performed. Must be 'lookupWord'.
    let action: LookupWordRequestAction
    /// The word to lookup in the dictionary.
    let word: String
}

enum LookupWordRequestAction: String, Codable {
    case lookupWord = "lookupWord"
}

/// Response from looking up a word in the dictionary.
// MARK: - LookupWordResponse
struct LookupWordResponse: Codable {
    /// The dictionary data for the word if found.
    let data: LookupWordResponseData?
    /// Error message if the lookup failed.
    let error: String?
    /// Whether the lookup was successful.
    let success: Bool
    /// Suggested words if the exact word was not found.
    let suggestions: [String]?
}

// MARK: - LookupWordResponseData
struct LookupWordResponseData: Codable {
    let definitions: [Items]?
    let word: String?
}

// MARK: - Items
struct Items: Codable {
    let definition: String?
    let examples: [String]?
    let meaning, partOfSpeech: String?
}

/// Request to open the extension popup with a prefilled word.
// MARK: - OpenPopupWithWordRequest
struct OpenPopupWithWordRequest: Codable {
    let action: OpenPopupWithWordRequestAction
    let word: String
}

enum OpenPopupWithWordRequestAction: String, Codable {
    case openPopupWithWord = "openPopupWithWord"
}

/// Response for opening the extension popup.
// MARK: - OpenPopupWithWordResponse
struct OpenPopupWithWordResponse: Codable {
    let data: OpenPopupWithWordResponseData?
    let error: String?
    let success: Bool
}

// MARK: - OpenPopupWithWordResponseData
struct OpenPopupWithWordResponseData: Codable {
    let popupOpened: Bool?
}

/// Request to submit a review result for a word.
// MARK: - SubmitReviewRequest
struct SubmitReviewRequest: Codable {
    /// The action to be performed. Must be 'submitReview'.
    let action: SubmitReviewRequestAction
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

enum SubmitReviewRequestAction: String, Codable {
    case submitReview = "submitReview"
}

/// The review result indicating how well the user knew the word.
enum ReviewResult: String, Codable {
    case known = "known"
    case mastered = "mastered"
    case skipped = "skipped"
    case unknown = "unknown"
}

/// Response from submitting a review result.
// MARK: - SubmitReviewResponse
struct SubmitReviewResponse: Codable {
    /// Updated word data and scheduling after review.
    let data: SubmitReviewResponseData?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the review was successfully submitted.
    let success: Bool
}

/// Updated word data and scheduling after review.
// MARK: - SubmitReviewResponseData
struct SubmitReviewResponseData: Codable {
    /// Days until next review; null if mastered.
    let nextInterval: Int?
    /// Next scheduled review date.
    let nextReview: Date?
    /// Full user-specific word entry after update.
    let word: Word?
}

/// Full user-specific word entry after update.
// MARK: - Word
struct Word: Codable {
    let customNotes: String?
    let dateAdded: Date?
    let difficulty: Int?
    let lastReviewed: Date?
    let nextReview: Date?
    let reviewHistory: [WordReviewHistory]?
    let word: String?
}

// MARK: - WordReviewHistory
struct WordReviewHistory: Codable {
    let date: Date?
    let result: String?
    let timeSpent: Double?
}

/// Request to update user settings.
// MARK: - UpdateSettingsRequest
struct UpdateSettingsRequest: Codable {
    /// The action to be performed. Must be 'updateSettings'.
    let action: UpdateSettingsRequestAction
    /// Settings to update.
    let settings: UpdateSettingsRequestSettings
}

enum UpdateSettingsRequestAction: String, Codable {
    case updateSettings = "updateSettings"
}

/// Settings to update.
// MARK: - UpdateSettingsRequestSettings
struct UpdateSettingsRequestSettings: Codable {
    /// Automatically add looked-up words to the default list.
    let autoAddLookups: Bool?
    let autoPlayPronunciation, showExampleSentences: Bool?
    let textSelectionMode: TextSelectionMode?
    let theme: Theme?
}

/// Response from updating user settings.
// MARK: - UpdateSettingsResponse
struct UpdateSettingsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Updated settings.
    let settings: UpdateSettingsResponseSettings?
    /// Whether the settings were successfully updated.
    let success: Bool
}

/// Updated settings.
// MARK: - UpdateSettingsResponseSettings
struct UpdateSettingsResponseSettings: Codable {
    let autoAddLookups, autoPlayPronunciation, showExampleSentences: Bool?
    let textSelectionMode: TextSelectionMode?
    let theme: Theme?
}

/// Request to update a word in a vocabulary list.
// MARK: - UpdateWordRequest
struct UpdateWordRequest: Codable {
    /// The action to be performed. Must be 'updateWord'.
    let action: UpdateWordRequestAction
    /// The ID of the vocabulary list containing the word.
    let listID: String
    /// The updates to apply to the word.
    let updates: Updates
    /// The word to update.
    let word: String

    enum CodingKeys: String, CodingKey {
        case action
        case listID = "listId"
        case updates, word
    }
}

enum UpdateWordRequestAction: String, Codable {
    case updateWord = "updateWord"
}

/// The updates to apply to the word.
// MARK: - Updates
struct Updates: Codable {
    /// Custom notes about the word
    let customNotes: String?
    /// Word frequency value (1 to ~330000)
    let difficulty: Int?
    let notes: String?
}

/// Response from updating a word in a vocabulary list.
// MARK: - UpdateWordResponse
struct UpdateWordResponse: Codable {
    /// The updated word entry.
    let data: UpdateWordResponseData?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the word was successfully updated.
    let success: Bool
}

/// The updated word entry.
// MARK: - UpdateWordResponseData
struct UpdateWordResponseData: Codable {
    /// Custom notes about the word
    let customNotes: String?
    /// Word difficulty (frequency) as an integer
    let difficulty: Int?
    let word: String?
}
