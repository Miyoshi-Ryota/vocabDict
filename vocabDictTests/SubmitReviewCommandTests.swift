import XCTest
import SwiftData
@testable import vocabDict

final class SubmitReviewCommandTests: XCTestCase {
    var store: CloudKitStore!; var context: ModelContext!
    override func setUp() { super.setUp(); store = CloudKitStore(inMemory: true); context = store.modelContext }
    override func tearDown() { context = nil; store = nil; super.tearDown() }

    func testSubmitKnownAdvancesInterval() throws {
        let list = VocabularyList(name: "L", isDefault: false)
        list.words["hello"] = UserSpecificData(word: "hello", difficulty: 5000)
        context.insert(list)
        try context.save()

        let req = ProtoSubmitReviewRequest(action: .submitReview, listID: list.id.uuidString, reviewResult: .known, timeSpent: 5, word: "hello")
        let resp = try SubmitReviewCommand.fromProto(req, context: context).execute()
        XCTAssertTrue(resp.success)
        XCTAssertEqual(resp.data?.nextInterval, 3)
        XCTAssertNotNil(resp.data?.nextReview)
        XCTAssertEqual(resp.data?.word?.word, "hello")
    }
}

