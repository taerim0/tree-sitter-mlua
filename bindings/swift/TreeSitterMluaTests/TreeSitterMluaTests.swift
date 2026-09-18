import XCTest
import SwiftTreeSitter
import TreeSitterMlua

final class TreeSitterMluaTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_mlua())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading mlua grammar")
    }
}
