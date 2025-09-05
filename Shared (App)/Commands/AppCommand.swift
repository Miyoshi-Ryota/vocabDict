//
//  AppCommand.swift
//  vocabDict
//
//  Commandプロトコル（共通）。
//

import Foundation
import SwiftData

public protocol AppCommand {
    associatedtype Request: Codable
    associatedtype Response: Codable
    static func fromProto(_ request: Request, context: ModelContext) -> Self
    func execute() throws -> Response
}

