//
//  UpdateWordCommand.swift
//  vocabDict
//
//  Command to update a word's fields in a VocabularyList.
//

import Foundation
import SwiftData

struct UpdateWordCommand: AppCommand {
    typealias Request = ProtoUpdateWordRequest
    typealias Response = ProtoUpdateWordResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> UpdateWordCommand {
        UpdateWordCommand(context: context, request: request)
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

        // Locate word (normalized key)
        let normalized = request.word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        guard let current = list.words[normalized] else {
            return Response(data: nil, error: "Word not found", success: false)
        }

        // Apply updates
        if let diff = request.updates.difficulty { current.difficulty = diff }
        if let notes = request.updates.customNotes { current.customNotes = notes }

        try context.save()

        // Return updated proto
        return Response(data: toProtoDataValue(current), error: nil, success: true)
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

