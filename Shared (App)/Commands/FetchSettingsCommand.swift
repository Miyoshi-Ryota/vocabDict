//
//  FetchSettingsCommand.swift
//  vocabDict
//

import Foundation
import SwiftData

struct FetchSettingsCommand: AppCommand {
    typealias Request = ProtoFetchSettingsRequest
    typealias Response = ProtoFetchSettingsResponse

    private let context: ModelContext

    static func fromProto(_ request: Request, context: ModelContext) -> FetchSettingsCommand {
        FetchSettingsCommand(context: context)
    }

    init(context: ModelContext) { self.context = context }

    func execute() throws -> Response {
        let descriptor = FetchDescriptor<UserSettings>()
        let settings = try context.fetch(descriptor).first ?? {
            let s = UserSettings()
            context.insert(s)
            return s
        }()
        return Response(error: nil, settings: toProtoSettings(settings), success: true)
    }

    func toProtoSettings(_ s: UserSettings) -> ProtoSettings {
        // map current values, allowing nil for partials not represented
        return ProtoSettings(
            autoAddLookups: s.autoAddLookups,
            autoPlayPronunciation: s.autoPlayPronunciation,
            showExampleSentences: s.showExampleSentences,
            textSelectionMode: ProtoTextSelectionMode(rawValue: s.textSelectionMode),
            theme: ProtoTheme(rawValue: s.theme)
        )
    }
}
