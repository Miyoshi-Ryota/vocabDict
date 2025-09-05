//
//  FetchVocabularyListWordsCommand.swift
//  vocabDict
//
//  Command to fetch words of a specific list with optional filter/sort and lookup stats.
//

import Foundation
import SwiftData

struct FetchVocabularyListWordsCommand: AppCommand {
    typealias Request = ProtoFetchVocabularyListWordsRequest
    typealias Response = ProtoFetchVocabularyListWordsResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> FetchVocabularyListWordsCommand {
        FetchVocabularyListWordsCommand(context: context, request: request)
    }

    init(context: ModelContext, request: Request) {
        self.context = context
        self.request = request
    }

    func execute() throws -> Response {
        // Fetch list
        guard let listUUID = UUID(uuidString: request.listID) else {
            return Response(data: nil, error: "Invalid list ID format", success: false)
        }
        let predicate = #Predicate<VocabularyList> { $0.id == listUUID }
        var descriptor = FetchDescriptor(predicate: predicate)
        descriptor.fetchLimit = 1
        guard let list = try context.fetch(descriptor).first else {
            return Response(data: nil, error: "List not found", success: false)
        }

        // Items from embedded dictionary
        var items = Array(list.words.values)

        // Filter by difficulty bucket if requested
        if let filter = request.filterBy {
            switch filter {
            case .all:
                break
            case .easy, .medium, .hard:
                func bucket(_ d: Int) -> ProtoFilterBy { return d <= 3000 ? .easy : (d < 10000 ? .medium : .hard) }
                items = items.filter { bucket($0.difficulty) == filter }
            }
        }

        // Build lookup stats map for current words
        let wordsSet = Set(items.map { $0.word.lowercased() })
        let stats = try context.fetch(FetchDescriptor<DictionaryLookupStats>())
        var lookupStats: [String: ProtoStatValue] = [:]
        for s in stats where wordsSet.contains(s.word) {
            lookupStats[s.word] = ProtoStatValue(count: s.count, firstLookup: s.firstLookup, lastLookup: s.lastLookup, word: s.word)
        }

        // Sorting
        if let sortBy = request.sortBy {
            let desc = (request.sortOrder == .desc)
            func cmp<T: Comparable>(_ a: T, _ b: T) -> Bool { return desc ? (a > b) : (a < b) }
            switch sortBy {
            case .alphabetical:
                items.sort { cmp($0.word, $1.word) }
            case .dateAdded:
                items.sort { cmp($0.dateAdded, $1.dateAdded) }
            case .lastReviewed:
                let reviewed = items.compactMap { ($0.lastReviewed == nil) ? nil : $0 }
                let notReviewed = items.filter { $0.lastReviewed == nil }
                let sorted = reviewed.sorted { (a, b) in
                    guard let la = a.lastReviewed, let lb = b.lastReviewed else { return false }
                    return desc ? (la > lb) : (la < lb)
                }
                items = sorted + notReviewed
            case .difficulty:
                items.sort { cmp($0.difficulty, $1.difficulty) }
            case .lookupCount:
                func count(_ w: String) -> Int { lookupStats[w.lowercased()]?.count ?? 0 }
                items.sort { cmp(count($0.word), count($1.word)) }
            }
        }

        // Map to proto types
        let protoWords = items.map { toProtoDataValue($0) }
        let data = ProtoFetchVocabularyListWordsResponseData(
            lookupStats: lookupStats.isEmpty ? nil : lookupStats,
            words: protoWords
        )
        return Response(data: data, error: nil, success: true)
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

