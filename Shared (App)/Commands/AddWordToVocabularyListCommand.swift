//
//  AddWordToVocabularyListCommand.swift
//  vocabDict
//
//  Command to add a word into a VocabularyList.
//

import Foundation
import SwiftData

struct AddWordToVocabularyListCommand: AppCommand {
    typealias Request = ProtoAddWordToVocabularyListRequest
    typealias Response = ProtoAddWordToVocabularyListResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> AddWordToVocabularyListCommand {
        AddWordToVocabularyListCommand(context: context, request: request)
    }

    init(context: ModelContext, request: Request) {
        self.context = context
        self.request = request
    }

    func execute() throws -> Response {
        // Validate list id
        guard let listUUID = UUID(uuidString: request.listID) else {
            return Response(data: nil, error: "Invalid list ID format", success: false)
        }

        // Fetch list
        let predicate = #Predicate<VocabularyList> { $0.id == listUUID }
        var descriptor = FetchDescriptor(predicate: predicate)
        descriptor.fetchLimit = 1

        guard let list = try context.fetch(descriptor).first else {
            return Response(data: nil, error: "Vocabulary list not found", success: false)
        }

        // Normalize key and check duplicate
        let normalized = request.word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if list.words[normalized] != nil {
            return Response(data: nil, error: "Word already exists", success: false)
        }

        // Build new entry
        let difficulty = request.metadata?.difficulty ?? 5000
        let customNotes = request.metadata?.customNotes ?? ""
        let entry = UserSpecificData(
            word: request.word,
            dateAdded: Date(),
            difficulty: difficulty,
            customNotes: customNotes,
            lastReviewed: nil,
            nextReview: Date(timeIntervalSinceNow: 86400),
            reviewHistory: []
        )

        list.words[normalized] = entry
        try context.save()

        return Response(data: toProtoDataValue(entry), error: nil, success: true)
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

