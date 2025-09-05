//
//  FetchLookupCountCommand.swift
//  vocabDict
//

import Foundation
import SwiftData

struct FetchLookupCountCommand: AppCommand {
    typealias Request = ProtoFetchLookupCountRequest
    typealias Response = ProtoFetchLookupCountResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> FetchLookupCountCommand {
        FetchLookupCountCommand(context: context, request: request)
    }

    init(context: ModelContext, request: Request) {
        self.context = context
        self.request = request
    }

    func execute() throws -> Response {
        let normalized = request.word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let predicate = #Predicate<DictionaryLookupStats> { $0.word == normalized }
        let descriptor = FetchDescriptor(predicate: predicate)
        let count = try context.fetch(descriptor).first?.count ?? 0
        return Response(count: count, error: nil, success: true)
    }
}

