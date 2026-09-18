# tree-sitter-mlua

[![CI][ci]](https://github.com/taerim0/tree-sitter-mlua/actions/workflows/ci.yml)

Tree-sitter grammar for **MapleStory Worlds' `.mlua` script/interface format**.

`.mlua` is a class-based DSL layered on top of a Lua-like expression/statement
language: the top level is one `script Name [extends Base] ... end`
declaration containing `property`/`method`/`member`/`emitter`/`handler`/
`constructor`/`operator` members (each optionally preceded by `@Decorator`
annotations), and method **bodies** are ordinary Lua statements/expressions.
`.d.mlua` files (native-API declarations, no method bodies) parse with the
same grammar.

There was no public tree-sitter grammar for this format anywhere at the time
this was written — confirmed by inspecting real MapleStory Worlds project
`.mlua` files directly, not assumed from documentation alone.

## Acknowledgement

This grammar is forked from [tree-sitter-grammars/tree-sitter-lua][ts-lua]
(MIT licensed, by Munif Tanjim) — `.mlua` method bodies are real Lua, so the
statement/expression/string/comment/number rules and the external scanner are
reused near-verbatim from that project rather than re-derived from scratch.
Only the top-level rules (`chunk`, `script`/`property`/`method`/`member`/
`emitter`/`handler`/`constructor`/`operator` declarations, decorators, and the
`type` rule for property/parameter/return types, including generics like
`List<Vector2>`) are new.

[ts-lua]: https://github.com/tree-sitter-grammars/tree-sitter-lua

[ci]: https://img.shields.io/github/actions/workflow/status/taerim0/tree-sitter-mlua/ci.yml?logo=github&label=CI
