//
//  IncrementLookupCountCommand.swift
//  vocabDict
//

import Foundation
import SwiftData

struct IncrementLookupCountCommand: AppCommand {
    typealias Request = ProtoIncrementLookupCountRequest
    typealias Response = ProtoIncrementLookupCountResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> IncrementLookupCountCommand {
        IncrementLookupCountCommand(context: context, request: request)
    }

    init(context: ModelContext, request: Request) {
        self.context = context
        self.request = request
    }

    func execute() throws -> Response {
        let normalized = request.word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let predicate = #Predicate<DictionaryLookupStats> { $0.word == normalized }
        let descriptor = FetchDescriptor(predicate: predicate)
        if let stats = try context.fetch(descriptor).first {
            stats.count += 1
            stats.lastLookup = Date()
        } else {
            let s = DictionaryLookupStats(word: normalized, count: 1, firstLookup: Date(), lastLookup: Date())
            context.insert(s)
        }
        try context.save()
        return Response(error: nil, success: true)
    }
}

