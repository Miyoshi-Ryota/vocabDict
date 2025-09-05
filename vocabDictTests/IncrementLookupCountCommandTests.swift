import XCTest
import SwiftData
@testable import vocabDict

final class IncrementLookupCountCommandTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testIncrementCreatesAndIncrements() throws {
        let inc = ProtoIncrementLookupCountRequest(action: .incrementLookupCount, word: "hello")
        _ = try IncrementLookupCountCommand.fromProto(inc, context: context).execute()
        _ = try IncrementLookupCountCommand.fromProto(inc, context: context).execute()

        let pred = #Predicate<DictionaryLookupStats> { $0.word == "hello" }
        let stats = try context.fetch(FetchDescriptor(predicate: pred)).first
        XCTAssertEqual(stats?.count, 2)
    }
}

