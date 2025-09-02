//
//  MessageValidator.swift
//  Helper for validating incoming messages using generated Codable types
//

import Foundation
import os.log

enum MessageValidator {
    
    static func validateAndDecode<T: Decodable>(_ type: T.Type, from dictionary: [String: Any]) -> Result<T, Error> {
        do {
            let data = try JSONSerialization.data(withJSONObject: dictionary, options: [])
            let decoded = try JSONDecoder().decode(type, from: data)
            return .success(decoded)
        } catch {
            os_log(.error, "Failed to decode %@: %@", String(describing: type), error.localizedDescription)
            return .failure(error)
        }
    }
    
    static func encode<T: Encodable>(_ value: T) -> [String: Any]? {
        do {
            let data = try JSONEncoder().encode(value)
            let dictionary = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
            return dictionary
        } catch {
            os_log(.error, "Failed to encode %@: %@", String(describing: type(of: value)), error.localizedDescription)
            return nil
        }
    }
}