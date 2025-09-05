//
//  FetchAllVocabularyListsCommand.swift
//  vocabDict
//
//  Created by Codex on 2025/09/04.
//

import Foundation
import SwiftData

// MARK: - FetchAllVocabularyListsCommand
struct FetchAllVocabularyListsCommand: AppCommand {
    typealias Request = ProtoFetchAllVocabularyListsRequest
    typealias Response = ProtoFetchAllVocabularyListsResponse

    private let context: ModelContext

    static func fromProto(_ request: Request, context: ModelContext) -> FetchAllVocabularyListsCommand {
        return FetchAllVocabularyListsCommand(context: context)
    }

    init(context: ModelContext) {
        self.context = context
    }

    func execute() throws -> Response {
        // Fetch all VocabularyList objects via SwiftData
        let lists: [VocabularyList]
        do {
            lists = try context.fetch(FetchDescriptor<VocabularyList>())
        } catch {
            // 失敗時は空配列で返却（エラー文字列はResponseに格納可能だが、既存IFと整合）
            return ProtoFetchAllVocabularyListsResponse(
                error: error.localizedDescription,
                success: false,
                vocabularyLists: []
            )
        }
        let mapped = lists.map { toProtoVocabularyList($0) }
        return ProtoFetchAllVocabularyListsResponse(
            error: nil,
            success: true,
            vocabularyLists: mapped
        )
    }

    // MARK: - Mapping
    private func toProtoVocabularyList(_ list: VocabularyList) -> ProtoVocabularyList {
        var wordsDict: [String: ProtoDataValue] = [:]
        for (key, value) in list.words { // key is normalized word
            wordsDict[key] = toProtoDataValue(value)
        }
        return ProtoVocabularyList(
            createdAt: list.createdAt,
            id: list.id.uuidString,
            isDefault: list.isDefault,
            name: list.name,
            words: wordsDict
        )
    }

    private func toProtoDataValue(_ data: UserSpecificData) -> ProtoDataValue {
        let reviews: [ProtoReviewHistoryElement]?
        if data.reviewHistory.isEmpty {
            reviews = nil
        } else {
            reviews = data.reviewHistory.map { entry in
                let result = ProtoReviewResult(rawValue: entry.result) ?? .unknown
                return ProtoReviewHistoryElement(date: entry.date, result: result, timeSpent: entry.timeSpent)
            }
        }

        return ProtoDataValue(
            customNotes: data.customNotes.isEmpty ? nil : data.customNotes,
            dateAdded: data.dateAdded,
            difficulty: data.difficulty,
            lastReviewed: data.lastReviewed,
            nextReview: data.nextReview,
            reviewHistory: reviews,
            word: data.word
        )
    }
}
