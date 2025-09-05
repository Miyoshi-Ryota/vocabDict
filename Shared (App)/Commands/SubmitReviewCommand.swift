//
//  SubmitReviewCommand.swift
//  vocabDict
//

import Foundation
import SwiftData

struct SubmitReviewCommand: AppCommand {
    typealias Request = ProtoSubmitReviewRequest
    typealias Response = ProtoSubmitReviewResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> SubmitReviewCommand {
        SubmitReviewCommand(context: context, request: request)
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

        // Fetch list and word
        let predicate = #Predicate<VocabularyList> { $0.id == listUUID }
        var descriptor = FetchDescriptor(predicate: predicate)
        descriptor.fetchLimit = 1
        guard let list = try context.fetch(descriptor).first else {
            return Response(data: nil, error: "Vocabulary list not found", success: false)
        }
        let normalized = request.word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        guard let wordData = list.words[normalized] else {
            return Response(data: nil, error: "Word not found", success: false)
        }

        // Spaced repetition logic
        let now = Date()
        let currentInterval = getCurrentInterval(lastReviewed: wordData.lastReviewed)
        let nextInterval = calculateNextInterval(currentInterval: currentInterval, result: request.reviewResult)

        wordData.lastReviewed = now
        if let i = nextInterval { wordData.nextReview = Calendar.current.date(byAdding: .day, value: i, to: now) ?? now }
        else { wordData.nextReview = Date.distantFuture }

        // Append history
        let entry = ReviewHistoryEntry(date: now, result: request.reviewResult.rawValue, timeSpent: request.timeSpent ?? 0)
        wordData.reviewHistory.append(entry)

        try context.save()

        let data = ProtoSubmitReviewResponseData(
            nextInterval: nextInterval,
            nextReview: wordData.nextReview,
            word: toProtoDataValue(wordData)
        )
        return Response(data: data, error: nil, success: true)
    }

    private func calculateNextInterval(currentInterval: Int, result: ProtoReviewResult) -> Int? {
        switch result {
        case .mastered: return nil
        case .unknown: return 1
        case .known:
            let progression: [Int: Int] = [1: 3, 3: 7, 7: 14, 14: 30, 30: 60]
            return progression[currentInterval] ?? currentInterval * 2
        case .skipped:
            return currentInterval
        }
    }

    private func getCurrentInterval(lastReviewed: Date?) -> Int {
        guard let last = lastReviewed else { return 1 }
        let days = Calendar.current.dateComponents([.day], from: last, to: Date()).day ?? 1
        return max(1, days)
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
