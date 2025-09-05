//
//  CreateVocabularyListCommand.swift
//  vocabDict
//
//  Command to create a new VocabularyList.
//

import Foundation
import SwiftData

struct CreateVocabularyListCommand: AppCommand {
    typealias Request = ProtoCreateVocabularyListRequest
    typealias Response = ProtoCreateVocabularyListResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> CreateVocabularyListCommand {
        return CreateVocabularyListCommand(context: context, request: request)
    }

    init(context: ModelContext, request: Request) {
        self.context = context
        self.request = request
    }

    func execute() throws -> Response {
        do {
            let list = VocabularyList(
                name: request.name,
                isDefault: request.isDefault ?? false
            )
            context.insert(list)
            try context.save()

            let proto = toProtoVocabularyList(list)
            return ProtoCreateVocabularyListResponse(
                error: nil,
                success: true,
                vocabularyList: proto
            )
        } catch {
            return ProtoCreateVocabularyListResponse(
                error: error.localizedDescription,
                success: false,
                vocabularyList: nil
            )
        }
    }

    private func toProtoVocabularyList(_ list: VocabularyList) -> ProtoVocabularyList {
        ProtoVocabularyList(
            createdAt: list.createdAt,
            id: list.id.uuidString,
            isDefault: list.isDefault,
            name: list.name,
            words: list.words.reduce(into: [String: ProtoDataValue]()) { acc, pair in
                acc[pair.key] = toProtoDataValue(pair.value)
            }
        )
    }

    private func toProtoDataValue(_ data: UserSpecificData) -> ProtoDataValue {
        let reviews: [ProtoReviewHistoryElement]? = data.reviewHistory.isEmpty ? nil : data.reviewHistory.map { entry in
            let result = ProtoReviewResult(rawValue: entry.result) ?? .unknown
            return ProtoReviewHistoryElement(date: entry.date, result: result, timeSpent: entry.timeSpent)
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
