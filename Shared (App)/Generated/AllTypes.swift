// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let protoAddRecentSearchRequest = try? JSONDecoder().decode(ProtoAddRecentSearchRequest.self, from: jsonData)
//   let protoAddWordToVocabularyListRequest = try? JSONDecoder().decode(ProtoAddWordToVocabularyListRequest.self, from: jsonData)
//   let protoCreateVocabularyListRequest = try? JSONDecoder().decode(ProtoCreateVocabularyListRequest.self, from: jsonData)
//   let protoFetchAllVocabularyListsRequest = try? JSONDecoder().decode(ProtoFetchAllVocabularyListsRequest.self, from: jsonData)
//   let protoFetchLookupCountRequest = try? JSONDecoder().decode(ProtoFetchLookupCountRequest.self, from: jsonData)
//   let protoFetchLookupStatsRequest = try? JSONDecoder().decode(ProtoFetchLookupStatsRequest.self, from: jsonData)
//   let protoFetchRecentSearchesRequest = try? JSONDecoder().decode(ProtoFetchRecentSearchesRequest.self, from: jsonData)
//   let protoFetchReviewQueueRequest = try? JSONDecoder().decode(ProtoFetchReviewQueueRequest.self, from: jsonData)
//   let protoFetchSettingsRequest = try? JSONDecoder().decode(ProtoFetchSettingsRequest.self, from: jsonData)
//   let protoFetchVocabularyListWordsRequest = try? JSONDecoder().decode(ProtoFetchVocabularyListWordsRequest.self, from: jsonData)
//   let protoGetPendingContextSearchRequest = try? JSONDecoder().decode(ProtoGetPendingContextSearchRequest.self, from: jsonData)
//   let protoIncrementLookupCountRequest = try? JSONDecoder().decode(ProtoIncrementLookupCountRequest.self, from: jsonData)
//   let protoLookupWordRequest = try? JSONDecoder().decode(ProtoLookupWordRequest.self, from: jsonData)
//   let protoOpenPopupWithWordRequest = try? JSONDecoder().decode(ProtoOpenPopupWithWordRequest.self, from: jsonData)
//   let protoSubmitReviewRequest = try? JSONDecoder().decode(ProtoSubmitReviewRequest.self, from: jsonData)
//   let protoUpdateSettingsRequest = try? JSONDecoder().decode(ProtoUpdateSettingsRequest.self, from: jsonData)
//   let protoUpdateWordRequest = try? JSONDecoder().decode(ProtoUpdateWordRequest.self, from: jsonData)
//   let protoAddRecentSearchResponse = try? JSONDecoder().decode(ProtoAddRecentSearchResponse.self, from: jsonData)
//   let protoAddWordToVocabularyListResponse = try? JSONDecoder().decode(ProtoAddWordToVocabularyListResponse.self, from: jsonData)
//   let protoCreateVocabularyListResponse = try? JSONDecoder().decode(ProtoCreateVocabularyListResponse.self, from: jsonData)
//   let protoFetchAllVocabularyListsResponse = try? JSONDecoder().decode(ProtoFetchAllVocabularyListsResponse.self, from: jsonData)
//   let protoFetchLookupCountResponse = try? JSONDecoder().decode(ProtoFetchLookupCountResponse.self, from: jsonData)
//   let protoFetchLookupStatsResponse = try? JSONDecoder().decode(ProtoFetchLookupStatsResponse.self, from: jsonData)
//   let protoFetchRecentSearchesResponse = try? JSONDecoder().decode(ProtoFetchRecentSearchesResponse.self, from: jsonData)
//   let protoFetchReviewQueueResponse = try? JSONDecoder().decode(ProtoFetchReviewQueueResponse.self, from: jsonData)
//   let protoFetchSettingsResponse = try? JSONDecoder().decode(ProtoFetchSettingsResponse.self, from: jsonData)
//   let protoFetchVocabularyListWordsResponse = try? JSONDecoder().decode(ProtoFetchVocabularyListWordsResponse.self, from: jsonData)
//   let protoGetPendingContextSearchResponse = try? JSONDecoder().decode(ProtoGetPendingContextSearchResponse.self, from: jsonData)
//   let protoIncrementLookupCountResponse = try? JSONDecoder().decode(ProtoIncrementLookupCountResponse.self, from: jsonData)
//   let protoLookupWordResponse = try? JSONDecoder().decode(ProtoLookupWordResponse.self, from: jsonData)
//   let protoOpenPopupWithWordResponse = try? JSONDecoder().decode(ProtoOpenPopupWithWordResponse.self, from: jsonData)
//   let protoSubmitReviewResponse = try? JSONDecoder().decode(ProtoSubmitReviewResponse.self, from: jsonData)
//   let protoUpdateSettingsResponse = try? JSONDecoder().decode(ProtoUpdateSettingsResponse.self, from: jsonData)
//   let protoUpdateWordResponse = try? JSONDecoder().decode(ProtoUpdateWordResponse.self, from: jsonData)

import Foundation

/// Request to add a word to recent searches.
// MARK: - ProtoAddRecentSearchRequest
struct ProtoAddRecentSearchRequest: Codable {
    /// The action to be performed. Must be 'addRecentSearch'.
    let action: ProtoAddRecentSearchRequestAction
    /// The word to add to recent searches.
    let word: String
}

enum ProtoAddRecentSearchRequestAction: String, Codable {
    case addRecentSearch = "addRecentSearch"
}

/// Request to add a word to a vocabulary list. It's used for all of
/// UI->(background)->(SwiftWebExtensionHandler)->SwiftData
// MARK: - ProtoAddWordToVocabularyListRequest
struct ProtoAddWordToVocabularyListRequest: Codable {
    /// The action to be performed. Must be 'addWordToVocabularyList'.
    let action: ProtoAddWordToVocabularyListRequestAction
    /// The ID of the vocabulary list to which the word will be added.
    let listID: String
    let metadata: ProtoMetadata?
    /// The word to be added to the vocabulary list.
    let word: String

    enum CodingKeys: String, CodingKey {
        case action
        case listID = "listId"
        case metadata, word
    }
}

enum ProtoAddWordToVocabularyListRequestAction: String, Codable {
    case addWordToVocabularyList = "addWordToVocabularyList"
}

// MARK: - ProtoMetadata
struct ProtoMetadata: Codable {
    /// Custom notes about the word
    let customNotes: String?
    /// Word frequency value (1 to ~330000)
    let difficulty: Int?
}

/// Request to create a new vocabulary list.
// MARK: - ProtoCreateVocabularyListRequest
struct ProtoCreateVocabularyListRequest: Codable {
    /// The action to be performed. Must be 'createVocabularyList'.
    let action: ProtoCreateVocabularyListRequestAction
    /// Whether this list should be the default list.
    let isDefault: Bool?
    /// The name of the new vocabulary list.
    let name: String
}

enum ProtoCreateVocabularyListRequestAction: String, Codable {
    case createVocabularyList = "createVocabularyList"
}

/// Request to fetch all vocabulary lists.
// MARK: - ProtoFetchAllVocabularyListsRequest
struct ProtoFetchAllVocabularyListsRequest: Codable {
    /// The action to be performed. Must be 'fetchAllVocabularyLists'.
    let action: ProtoFetchAllVocabularyListsRequestAction
}

enum ProtoFetchAllVocabularyListsRequestAction: String, Codable {
    case fetchAllVocabularyLists = "fetchAllVocabularyLists"
}

/// Request to fetch the lookup count for a specific word.
// MARK: - ProtoFetchLookupCountRequest
struct ProtoFetchLookupCountRequest: Codable {
    /// The action to be performed. Must be 'fetchLookupCount'.
    let action: ProtoFetchLookupCountRequestAction
    /// The word to get the lookup count for.
    let word: String
}

enum ProtoFetchLookupCountRequestAction: String, Codable {
    case fetchLookupCount = "fetchLookupCount"
}

/// Request to fetch lookup statistics.
// MARK: - ProtoFetchLookupStatsRequest
struct ProtoFetchLookupStatsRequest: Codable {
    /// The action to be performed. Must be 'fetchLookupStats'.
    let action: ProtoFetchLookupStatsRequestAction
}

enum ProtoFetchLookupStatsRequestAction: String, Codable {
    case fetchLookupStats = "fetchLookupStats"
}

/// Request to fetch recent searches.
// MARK: - ProtoFetchRecentSearchesRequest
struct ProtoFetchRecentSearchesRequest: Codable {
    /// The action to be performed. Must be 'fetchRecentSearches'.
    let action: ProtoFetchRecentSearchesRequestAction
    /// Maximum number of recent searches to return.
    let limit: Int?
}

enum ProtoFetchRecentSearchesRequestAction: String, Codable {
    case fetchRecentSearches = "fetchRecentSearches"
}

/// Request to fetch words due for review.
// MARK: - ProtoFetchReviewQueueRequest
struct ProtoFetchReviewQueueRequest: Codable {
    /// The action to be performed. Must be 'fetchReviewQueue'.
    let action: ProtoFetchReviewQueueRequestAction
    /// Maximum number of words to return in the review queue.
    let maxWords: Int?
}

enum ProtoFetchReviewQueueRequestAction: String, Codable {
    case fetchReviewQueue = "fetchReviewQueue"
}

/// Request to fetch user settings.
// MARK: - ProtoFetchSettingsRequest
struct ProtoFetchSettingsRequest: Codable {
    /// The action to be performed. Must be 'fetchSettings'.
    let action: ProtoFetchSettingsRequestAction
}

enum ProtoFetchSettingsRequestAction: String, Codable {
    case fetchSettings = "fetchSettings"
}

/// Request to fetch words from a specific vocabulary list.
// MARK: - ProtoFetchVocabularyListWordsRequest
struct ProtoFetchVocabularyListWordsRequest: Codable {
    /// The action to be performed. Must be 'fetchVocabularyListWords'.
    let action: ProtoFetchVocabularyListWordsRequestAction
    /// Filter words by difficulty level.
    let filterBy: ProtoFilterBy?
    /// The ID of the vocabulary list to fetch words from.
    let listID: String
    /// Sort words by specified criteria.
    let sortBy: ProtoSortBy?
    /// Sort order (ascending or descending).
    let sortOrder: ProtoSortOrder?

    enum CodingKeys: String, CodingKey {
        case action, filterBy
        case listID = "listId"
        case sortBy, sortOrder
    }
}

enum ProtoFetchVocabularyListWordsRequestAction: String, Codable {
    case fetchVocabularyListWords = "fetchVocabularyListWords"
}

/// Filter words by difficulty level.
enum ProtoFilterBy: String, Codable {
    case all = "all"
    case easy = "easy"
    case hard = "hard"
    case medium = "medium"
}

/// Sort words by specified criteria.
enum ProtoSortBy: String, Codable {
    case alphabetical = "alphabetical"
    case dateAdded = "dateAdded"
    case difficulty = "difficulty"
    case lastReviewed = "lastReviewed"
    case lookupCount = "lookupCount"
}

/// Sort order (ascending or descending).
enum ProtoSortOrder: String, Codable {
    case asc = "asc"
    case desc = "desc"
}

/// Request to retrieve a pending word selection to search when opening popup.
// MARK: - ProtoGetPendingContextSearchRequest
struct ProtoGetPendingContextSearchRequest: Codable {
    let action: ProtoGetPendingContextSearchRequestAction
}

enum ProtoGetPendingContextSearchRequestAction: String, Codable {
    case getPendingContextSearch = "getPendingContextSearch"
}

/// Request to increment the lookup count for a word.
// MARK: - ProtoIncrementLookupCountRequest
struct ProtoIncrementLookupCountRequest: Codable {
    /// The action to be performed. Must be 'incrementLookupCount'.
    let action: ProtoIncrementLookupCountRequestAction
    /// The word whose lookup count should be incremented.
    let word: String
}

enum ProtoIncrementLookupCountRequestAction: String, Codable {
    case incrementLookupCount = "incrementLookupCount"
}

/// Request to lookup a word in the dictionary.
// MARK: - ProtoLookupWordRequest
struct ProtoLookupWordRequest: Codable {
    /// The action to be performed. Must be 'lookupWord'.
    let action: ProtoLookupWordRequestAction
    /// The word to lookup in the dictionary.
    let word: String
}

enum ProtoLookupWordRequestAction: String, Codable {
    case lookupWord = "lookupWord"
}

/// Request to open the extension popup with a prefilled word.
// MARK: - ProtoOpenPopupWithWordRequest
struct ProtoOpenPopupWithWordRequest: Codable {
    let action: ProtoOpenPopupWithWordRequestAction
    let word: String
}

enum ProtoOpenPopupWithWordRequestAction: String, Codable {
    case openPopupWithWord = "openPopupWithWord"
}

/// Request to submit a review result for a word.
// MARK: - ProtoSubmitReviewRequest
struct ProtoSubmitReviewRequest: Codable {
    /// The action to be performed. Must be 'submitReview'.
    let action: ProtoSubmitReviewRequestAction
    /// The ID of the vocabulary list containing the word.
    let listID: String
    /// The review result indicating how well the user knew the word.
    let reviewResult: ProtoReviewResult
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

enum ProtoSubmitReviewRequestAction: String, Codable {
    case submitReview = "submitReview"
}

/// The review result indicating how well the user knew the word.
enum ProtoReviewResult: String, Codable {
    case known = "known"
    case mastered = "mastered"
    case skipped = "skipped"
    case unknown = "unknown"
}

/// Request to update user settings.
// MARK: - ProtoUpdateSettingsRequest
struct ProtoUpdateSettingsRequest: Codable {
    /// The action to be performed. Must be 'updateSettings'.
    let action: ProtoUpdateSettingsRequestAction
    /// Settings to update.
    let settings: ProtoSettings
}

enum ProtoUpdateSettingsRequestAction: String, Codable {
    case updateSettings = "updateSettings"
}

/// Settings to update.
// MARK: - ProtoSettings
struct ProtoSettings: Codable {
    let autoAddLookups, autoPlayPronunciation, showExampleSentences: Bool?
    let textSelectionMode: ProtoTextSelectionMode?
    let theme: ProtoTheme?
}

enum ProtoTextSelectionMode: String, Codable {
    case inline = "inline"
    case popup = "popup"
}

enum ProtoTheme: String, Codable {
    case auto = "auto"
    case dark = "dark"
    case light = "light"
}

/// Request to update a word in a vocabulary list.
// MARK: - ProtoUpdateWordRequest
struct ProtoUpdateWordRequest: Codable {
    /// The action to be performed. Must be 'updateWord'.
    let action: ProtoUpdateWordRequestAction
    /// The ID of the vocabulary list containing the word.
    let listID: String
    /// The updates to apply to the word.
    let updates: ProtoUpdates
    /// The word to update.
    let word: String

    enum CodingKeys: String, CodingKey {
        case action
        case listID = "listId"
        case updates, word
    }
}

enum ProtoUpdateWordRequestAction: String, Codable {
    case updateWord = "updateWord"
}

/// The updates to apply to the word.
// MARK: - ProtoUpdates
struct ProtoUpdates: Codable {
    /// Custom notes about the word
    let customNotes: String?
    /// Word frequency value (1 to ~330000)
    let difficulty: Int?
}

/// Response from adding a word to recent searches.
// MARK: - ProtoAddRecentSearchResponse
struct ProtoAddRecentSearchResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the word was successfully added to recent searches.
    let success: Bool
}

/// Response from adding a word to a vocabulary list.
// MARK: - ProtoAddWordToVocabularyListResponse
struct ProtoAddWordToVocabularyListResponse: Codable {
    /// The user-specific word entry as stored.
    let data: ProtoDataValue?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the word was successfully added.
    let success: Bool
}

/// The user-specific word entry as stored.
///
/// The updated word entry.
// MARK: - ProtoDataValue
struct ProtoDataValue: Codable {
    let customNotes: String?
    let dateAdded: Date
    let difficulty: Int
    let lastReviewed: Date?
    let nextReview: Date
    let reviewHistory: [ProtoReviewHistoryElement]?
    let word: String
}

// MARK: - ProtoReviewHistoryElement
struct ProtoReviewHistoryElement: Codable {
    let date: Date
    let result: ProtoReviewResult
    let timeSpent: Double
}

/// Response from creating a new vocabulary list.
// MARK: - ProtoCreateVocabularyListResponse
struct ProtoCreateVocabularyListResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the list was successfully created.
    let success: Bool
    /// The created vocabulary list.
    let vocabularyList: ProtoVocabularyList?
}

/// The created vocabulary list.
// MARK: - ProtoVocabularyList
struct ProtoVocabularyList: Codable {
    let createdAt: Date
    let id: String
    let isDefault: Bool
    let name: String
    let words: [String: ProtoDataValue]
}

/// Response containing all vocabulary lists.
// MARK: - ProtoFetchAllVocabularyListsResponse
struct ProtoFetchAllVocabularyListsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the fetch was successful.
    let success: Bool
    /// Array of vocabulary lists.
    let vocabularyLists: [ProtoVocabularyList]?
}

/// Response containing the lookup count for a word.
// MARK: - ProtoFetchLookupCountResponse
struct ProtoFetchLookupCountResponse: Codable {
    /// The number of times the word has been looked up.
    let count: Int?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the fetch was successful.
    let success: Bool
}

/// Response containing lookup statistics.
// MARK: - ProtoFetchLookupStatsResponse
struct ProtoFetchLookupStatsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Lookup statistics by word.
    let stats: [String: ProtoStatValue]?
    /// Whether the fetch was successful.
    let success: Bool
}

// MARK: - ProtoStatValue
struct ProtoStatValue: Codable {
    let count: Int
    let firstLookup, lastLookup: Date
    let word: String
}

/// Response containing recent searches.
// MARK: - ProtoFetchRecentSearchesResponse
struct ProtoFetchRecentSearchesResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Array of recent search words.
    let recentSearches: [String]?
    /// Whether the fetch was successful.
    let success: Bool
}

/// Response containing words due for review.
// MARK: - ProtoFetchReviewQueueResponse
struct ProtoFetchReviewQueueResponse: Codable {
    /// Array of words due for review.
    let data: [ProtoDatumElement]?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the fetch was successful.
    let success: Bool
}

// MARK: - ProtoDatumElement
struct ProtoDatumElement: Codable {
    let difficulty: Int
    let listID, listName: String
    let nextReview: Date
    let word: String

    enum CodingKeys: String, CodingKey {
        case difficulty
        case listID = "listId"
        case listName, nextReview, word
    }
}

/// Response containing user settings.
// MARK: - ProtoFetchSettingsResponse
struct ProtoFetchSettingsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    let settings: ProtoSettings?
    /// Whether the fetch was successful.
    let success: Bool
}

/// Response containing words and lookup stats for a vocabulary list.
// MARK: - ProtoFetchVocabularyListWordsResponse
struct ProtoFetchVocabularyListWordsResponse: Codable {
    /// Words and aggregated lookup statistics.
    let data: ProtoFetchVocabularyListWordsResponseData?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the fetch was successful.
    let success: Bool
}

/// Words and aggregated lookup statistics.
// MARK: - ProtoFetchVocabularyListWordsResponseData
struct ProtoFetchVocabularyListWordsResponseData: Codable {
    /// Lookup statistics keyed by word.
    let lookupStats: [String: ProtoStatValue]?
    /// Array of user-specific word entries.
    let words: [ProtoDataValue]?
}

/// Response containing a pending word for context search, if any.
// MARK: - ProtoGetPendingContextSearchResponse
struct ProtoGetPendingContextSearchResponse: Codable {
    let data: String?
    let error: String?
    let success: Bool
}

/// Response from incrementing the lookup count for a word.
// MARK: - ProtoIncrementLookupCountResponse
struct ProtoIncrementLookupCountResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    /// Whether the lookup count was successfully incremented.
    let success: Bool
}

/// Response from looking up a word in the dictionary.
// MARK: - ProtoLookupWordResponse
struct ProtoLookupWordResponse: Codable {
    /// The dictionary data for the word if found.
    let data: ProtoLookupWordResponseData?
    /// Error message if the lookup failed.
    let error: String?
    /// Whether the lookup was successful.
    let success: Bool
    /// Suggested words if the exact word was not found.
    let suggestions: [String]?
}

// MARK: - ProtoLookupWordResponseData
struct ProtoLookupWordResponseData: Codable {
    /// Antonyms for the word.
    let antonyms: [String]?
    let definitions: [ProtoItems]?
    /// Pronunciation text for the word.
    let pronunciation: String?
    /// Synonyms for the word.
    let synonyms: [String]?
    let word: String?
}

// MARK: - ProtoItems
struct ProtoItems: Codable {
    let definition: String?
    let examples: [String]
    let meaning, partOfSpeech: String
}

/// Response for opening the extension popup.
// MARK: - ProtoOpenPopupWithWordResponse
struct ProtoOpenPopupWithWordResponse: Codable {
    let data: ProtoOpenPopupWithWordResponseData?
    let error: String?
    let success: Bool
}

// MARK: - ProtoOpenPopupWithWordResponseData
struct ProtoOpenPopupWithWordResponseData: Codable {
    let popupOpened: Bool?
}

/// Response from submitting a review result.
// MARK: - ProtoSubmitReviewResponse
struct ProtoSubmitReviewResponse: Codable {
    /// Updated word data and scheduling after review.
    let data: ProtoSubmitReviewResponseData?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the review was successfully submitted.
    let success: Bool
}

/// Updated word data and scheduling after review.
// MARK: - ProtoSubmitReviewResponseData
struct ProtoSubmitReviewResponseData: Codable {
    /// Days until next review; null if mastered.
    let nextInterval: Int?
    /// Next scheduled review date.
    let nextReview: Date?
    let word: ProtoDataValue?
}

/// Response from updating user settings.
// MARK: - ProtoUpdateSettingsResponse
struct ProtoUpdateSettingsResponse: Codable {
    /// Error message if the operation failed.
    let error: String?
    let settings: ProtoSettings?
    /// Whether the settings were successfully updated.
    let success: Bool
}

/// Response from updating a word in a vocabulary list.
// MARK: - ProtoUpdateWordResponse
struct ProtoUpdateWordResponse: Codable {
    /// The updated word entry.
    let data: ProtoDataValue?
    /// Error message if the operation failed.
    let error: String?
    /// Whether the word was successfully updated.
    let success: Bool
}
