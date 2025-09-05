//
//  AddRecentSearchCommand.swift
//  vocabDict
//

import Foundation
import SwiftData

struct AddRecentSearchCommand: AppCommand {
    typealias Request = ProtoAddRecentSearchRequest
    typealias Response = ProtoAddRecentSearchResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> AddRecentSearchCommand {
        AddRecentSearchCommand(context: context, request: request)
    }

    init(context: ModelContext, request: Request) {
        self.context = context
        self.request = request
    }

    func execute() throws -> Response {
        let entry = RecentSearchHistory(word: request.word, searchedAt: Date())
        context.insert(entry)

        // keep only latest 10
        var descriptor = FetchDescriptor<RecentSearchHistory>(
            sortBy: [SortDescriptor(\.searchedAt, order: .reverse)]
        )
        descriptor.fetchLimit = 100
        let all = try context.fetch(descriptor)
        if all.count > 10 {
            for i in 10..<all.count { context.delete(all[i]) }
        }

        try context.save()
        return Response(error: nil, success: true)
    }
}

