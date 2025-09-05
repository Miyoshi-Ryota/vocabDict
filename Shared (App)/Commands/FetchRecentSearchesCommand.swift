//
//  FetchRecentSearchesCommand.swift
//  vocabDict
//

import Foundation
import SwiftData

struct FetchRecentSearchesCommand: AppCommand {
    typealias Request = ProtoFetchRecentSearchesRequest
    typealias Response = ProtoFetchRecentSearchesResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> FetchRecentSearchesCommand {
        FetchRecentSearchesCommand(context: context, request: request)
    }

    init(context: ModelContext, request: Request) {
        self.context = context
        self.request = request
    }

    func execute() throws -> Response {
        var descriptor = FetchDescriptor<RecentSearchHistory>(
            sortBy: [SortDescriptor(\.searchedAt, order: .reverse)]
        )
        descriptor.fetchLimit = request.limit ?? 10
        let searches = try context.fetch(descriptor)
        let words = searches.map { $0.word }
        return Response(error: nil, recentSearches: words, success: true)
    }
}

