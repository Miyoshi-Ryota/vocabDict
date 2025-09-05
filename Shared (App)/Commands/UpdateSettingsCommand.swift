//
//  UpdateSettingsCommand.swift
//  vocabDict
//

import Foundation
import SwiftData

struct UpdateSettingsCommand: AppCommand {
    typealias Request = ProtoUpdateSettingsRequest
    typealias Response = ProtoUpdateSettingsResponse

    private let context: ModelContext
    private let request: Request

    static func fromProto(_ request: Request, context: ModelContext) -> UpdateSettingsCommand {
        UpdateSettingsCommand(context: context, request: request)
    }

    init(context: ModelContext, request: Request) {
        self.context = context
        self.request = request
    }

    func execute() throws -> Response {
        let descriptor = FetchDescriptor<UserSettings>()
        let settings = try context.fetch(descriptor).first ?? {
            let s = UserSettings(); context.insert(s); return s
        }()

        if let theme = request.settings.theme?.rawValue { settings.theme = theme }
        if let autoPlay = request.settings.autoPlayPronunciation { settings.autoPlayPronunciation = autoPlay }
        if let show = request.settings.showExampleSentences { settings.showExampleSentences = show }
        if let mode = request.settings.textSelectionMode?.rawValue { settings.textSelectionMode = mode }
        if let autoAdd = request.settings.autoAddLookups { settings.autoAddLookups = autoAdd }

        try context.save()
        return Response(error: nil, settings: FetchSettingsCommand(context: context).toProtoSettings(settings), success: true)
    }
}

