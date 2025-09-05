//
//  FetchLookupStatsCommand.swift
//  vocabDict
//

import Foundation
import SwiftData

struct FetchLookupStatsCommand: AppCommand {
    typealias Request = ProtoFetchLookupStatsRequest
    typealias Response = ProtoFetchLookupStatsResponse

    private let context: ModelContext

    static func fromProto(_ request: Request, context: ModelContext) -> FetchLookupStatsCommand {
        FetchLookupStatsCommand(context: context)
    }

    init(context: ModelContext) { self.context = context }

    func execute() throws -> Response {
        let stats = try context.fetch(FetchDescriptor<DictionaryLookupStats>())
        var map: [String: ProtoStatValue] = [:]
        for s in stats {
            map[s.word] = ProtoStatValue(count: s.count, firstLookup: s.firstLookup, lastLookup: s.lastLookup, word: s.word)
        }
        return Response(error: nil, stats: map, success: true)
    }
}

