// tree-sitter grammar for MapleStory Worlds' ".mlua" script/interface format.
//
// .mlua is a class-based DSL layered on top of a Lua-like expression/
// statement language: the top level is one `script Name [extends Base] ...
// end` declaration containing `property`/`method`/`member`/`emitter`
// members (each optionally preceded by `@Decorator` annotations), and
// method BODIES are ordinary Lua statements/expressions. There is no public
// tree-sitter grammar for this format anywhere -- confirmed by inspecting a
// real MapleStory Worlds project's .mlua files directly (see Ziplex's
// testfiles/Practice/), not assumed from documentation alone.
//
// The statement/expression/string/comment/number rules below are reused
// near-verbatim from tree-sitter-lua (https://github.com/tree-sitter-grammars/tree-sitter-lua,
// MIT licensed) -- .mlua method bodies are real Lua, so there is no reason
// to re-derive that grammar from scratch. Only the top-level rules (chunk,
// script/property/method/member/emitter declarations, decorators, and the
// `type` rule for property/parameter/return types, including generics like
// `List<Vector2>`) are new.

const PREC = {
  OR: 1,
  AND: 2,
  COMPARATIVE: 3,
  BIT_OR: 4,
  BIT_NOT: 5,
  BIT_AND: 6,
  BIT_SHIFT: 7,
  CONCATENATION: 8,
  ADDITIVE: 9,
  MULTIPLICATIVE: 10,
  UNARY: 11,
  POWER: 12,
  CALL: 13,
};

const WHITESPACE = /\s/;
const IDENTIFIER = /[a-zA-Z_][0-9a-zA-Z_]*/;
const DECIMAL_DIGIT = /[0-9]/;
const HEXADECIMAL_DIGIT = /[0-9a-fA-F]/;

const _numeral = (digit) =>
  choice(
    repeat1(digit),
    seq(repeat1(digit), ".", repeat(digit)),
    seq(repeat(digit), ".", repeat1(digit)),
  );

const _exponent_part = (...delimiters) =>
  seq(
    choice(...delimiters),
    optional(choice("+", "-")),
    repeat1(DECIMAL_DIGIT),
  );

const _list = (rule, separator) => seq(rule, repeat(seq(separator, rule)));

module.exports = grammar({
  name: "mlua",

  rules: {
    // ---- top level -------------------------------------------------
    chunk: ($) => repeat1($._top_level_declaration),

    _top_level_declaration: ($) => $.script_declaration,

    decorator: ($) =>
      seq("@", field("name", $.identifier), optional($.decorator_arguments)),
    decorator_arguments: ($) => seq("(", optional($.expression_list), ")"),

    // A script's own name can carry generic type parameters, e.g.
    // "script List<V>" / "script Dictionary<K, V>" (a generic collection
    // type's own native-API declaration) -- the type parameters themselves
    // are bare identifiers (no bounds/defaults seen anywhere in a real
    // project), reused as ordinary types elsewhere in the same script's
    // own property/parameter/return-type positions (e.g. "method boolean
    // Contains(V item)").
    script_declaration: ($) =>
      seq(
        repeat($.decorator),
        "script",
        field("name", $.identifier),
        optional($.type_parameters),
        optional(seq("extends", field("base", $.type))),
        repeat($._member_declaration),
        "end",
      ),
    type_parameters: ($) => seq("<", _list(field("parameter", $.identifier), ","), ">"),

    _member_declaration: ($) =>
      choice(
        $.property_declaration,
        $.method_declaration,
        $.member_declaration,
        $.emitter_declaration,
        $.handler_declaration,
        $.constructor_declaration,
        $.operator_declaration,
      ),

    // "constructor Vector2(float x, float y) end" -- no return type (it
    // always constructs the enclosing script's own type) and no
    // "method"/"static" keyword of its own.
    constructor_declaration: ($) =>
      seq(
        repeat($.decorator),
        "constructor",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(field("body", $.block)),
        "end",
      ),

    // "static operator boolean Inequality(Vector2 left, Vector2 right)
    // end" -- an operator overload, same shape as method_declaration
    // (every real sample is "static", but the modifier is kept optional
    // rather than required in case a future/undiscovered instance-level
    // operator exists).
    operator_declaration: ($) =>
      seq(
        repeat($.decorator),
        optional(field("modifier", "static")),
        "operator",
        field("return_type", $.type_list),
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(field("body", $.block)),
        "end",
      ),

    // A native-API property can carry both modifiers at once ("static
    // readonly property Vector2 down") -- repeat(choice(...)) rather than
    // two independent optionals so either order / either one alone / both
    // together all parse the same way, with no real sample ever showing
    // more than one of each.
    property_declaration: ($) =>
      seq(
        repeat($.decorator),
        repeat(field("modifier", choice("static", "readonly"))),
        "property",
        field("type", $.type),
        field("name", $.identifier),
        optional(seq("=", field("value", $.expression))),
      ),

    // Enum member ("member KR = 0") -- only ever seen directly inside a
    // script with no `extends` clause (an @Enum-decorated declaration),
    // but accepted anywhere in a member list rather than special-cased to
    // "enum only": a member list is otherwise indistinguishable from a
    // component's without re-deriving whether @Enum was present, and
    // there's no real ambiguity risk (no other member kind starts with
    // the bare word "member").
    member_declaration: ($) =>
      seq("member", field("name", $.identifier), "=", field("value", $.expression)),

    // Return type is a comma-separated list, not just one type -- a real
    // .d.mlua API declaration routinely returns more than one value, e.g.
    // "method LeaderboardResultCode, LeaderboardInfo CreateLeaderboardAndWait(...)".
    method_declaration: ($) =>
      seq(
        repeat($.decorator),
        optional(field("modifier", "static")),
        "method",
        field("return_type", $.type_list),
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(field("body", $.block)),
        "end",
      ),
    type_list: ($) => _list($.type, ","),

    // A native-API declaration file (.d.mlua) has no return type on an
    // emitter the way method_declaration does -- "emitter Name(...) end".
    emitter_declaration: ($) =>
      seq(
        repeat($.decorator),
        "emitter",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(field("body", $.block)),
        "end",
      ),

    // An event handler ("handler HandleKeyDownEvent(KeyDownEvent event)
    // ... end") -- same shape as emitter_declaration (no return type) but
    // always carries a real body reacting to the event, unlike an emitter
    // (which only ever fires one).
    handler_declaration: ($) =>
      seq(
        repeat($.decorator),
        "handler",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(field("body", $.block)),
        "end",
      ),

    parameter_list: ($) => seq("(", optional($.parameter_seq), ")"),
    parameter_seq: ($) => _list($.parameter, ","),
    // A trailing "..." marks a variadic parameter, e.g.
    // "method string GetTextFormat(string key, any... args) end".
    parameter: ($) =>
      seq(
        field("type", $.type),
        optional(field("variadic", "...")),
        field("name", $.identifier),
        optional(seq("=", field("default", $.expression))),
      ),

    // "Vector2", "int32", "List<Item>", "SyncList<Vector2>" -- a bare
    // identifier, optionally with one or more comma-separated generic type
    // arguments. Never confused with a real Lua comparison expression
    // (`a < b`) since `type` only ever appears in a property/parameter/
    // return-type slot, never inside `expression` itself. The optional
    // "-> ReturnType" suffix is a callback-parameter type, e.g.
    // "func<string> -> boolean callbackFunction" (a parameter named
    // callbackFunction, typed as a func<string>-to-boolean callback).
    type: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("<", _list(field("argument", $.type), ","), ">")),
        optional(seq("->", field("returns", $.type))),
      ),

    // ---- statements (verbatim from tree-sitter-lua) -----------------
    block: ($) => $._block,
    _block: ($) =>
      choice(
        $.return_statement,
        seq(repeat1($.statement), optional($.return_statement)),
      ),

    return_statement: ($) =>
      seq("return", optional($.expression_list), optional($.empty_statement)),

    statement: ($) =>
      choice(
        $.empty_statement,
        $.variable_assignment,
        $.compound_assignment_statement,
        $.local_variable_declaration,
        $.call,
        $.label_statement,
        $.goto_statement,
        $.break_statement,
        $.continue_statement,
        $.do_statement,
        $.while_statement,
        $.repeat_statement,
        $.if_statement,
        $.for_numeric_statement,
        $.for_generic_statement,
        $.function_definition_statement,
        $.local_function_definition_statement,
      ),

    // Two real extensions .mlua's method-body Lua doesn't share with
    // stock Lua (which has neither): a "continue" loop-control keyword
    // (Lua only has "break", normally emulated with goto), and augmented
    // assignment (+=/-=/*=//=), confirmed directly against real component
    // scripts (UnitMoveComponent.mlua, LobbyController.mlua, ...).
    continue_statement: () => "continue",
    compound_assignment_statement: ($) =>
      seq(
        field("left", $.variable),
        field("operator", choice("+=", "-=", "*=", "/=", "%=")),
        field("right", $.expression),
      ),

    local_function_definition_statement: ($) =>
      seq("local", "function", field("name", $.identifier), $._function_body),

    function_definition_statement: ($) =>
      seq(
        "function",
        field(
          "name",
          choice($.identifier, alias($._table_function_variable, $.variable)),
        ),
        $._function_body,
      ),
    _table_function_variable: ($) =>
      seq(
        $._table_identifier,
        choice($._named_field_identifier, $._method_identifier),
      ),
    _table_identifier: ($) =>
      field(
        "table",
        choice($.identifier, alias($._table_field_variable, $.variable)),
      ),
    _table_field_variable: ($) =>
      seq($._table_identifier, $._named_field_identifier),

    for_generic_statement: ($) =>
      seq(
        "for",
        field("left", alias($._name_list, $.variable_list)),
        "in",
        field("right", alias($._value_list, $.expression_list)),
        "do",
        optional(field("body", $.block)),
        "end",
      ),
    _name_list: ($) => _list(field("name", $.identifier), ","),
    _value_list: ($) => _list(field("value", $.expression), ","),

    for_numeric_statement: ($) =>
      seq(
        "for",
        field("name", $.identifier),
        "=",
        field("start", $.expression),
        ",",
        field("end", $.expression),
        optional(seq(",", field("step", $.expression))),
        "do",
        optional(field("body", $.block)),
        "end",
      ),

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        "then",
        optional(field("consequence", $.block)),
        repeat(field("alternative", $.elseif_clause)),
        optional(field("alternative", $.else_clause)),
        "end",
      ),
    elseif_clause: ($) =>
      seq(
        "elseif",
        field("condition", $.expression),
        "then",
        optional(field("consequence", $.block)),
      ),
    else_clause: ($) => seq("else", optional(field("body", $.block))),

    repeat_statement: ($) =>
      seq(
        "repeat",
        optional(field("body", $.block)),
        "until",
        field("condition", $.expression),
      ),

    while_statement: ($) =>
      seq(
        "while",
        field("condition", $.expression),
        "do",
        optional(field("body", $.block)),
        "end",
      ),

    do_statement: ($) => seq("do", optional(field("body", $.block)), "end"),

    break_statement: () => "break",

    goto_statement: ($) => seq("goto", field("name", $.identifier)),
    label_statement: ($) => seq("::", field("name", $.identifier), "::"),

    local_variable_declaration: ($) =>
      seq(
        "local",
        alias($._local_variable_list, $.variable_list),
        optional(seq("=", alias($._value_list, $.expression_list))),
      ),
    _local_variable_list: ($) =>
      _list(alias($._local_variable, $.variable), ","),
    _local_variable: ($) =>
      seq(field("name", $.identifier), optional($.attribute)),
    attribute: ($) => seq("<", field("name", $.identifier), ">"),

    variable_assignment: ($) =>
      seq($.variable_list, "=", alias($._value_list, $.expression_list)),
    variable_list: ($) => _list($.variable, ","),

    empty_statement: () => ";",

    // ---- expressions (verbatim from tree-sitter-lua) ----------------
    expression: ($) =>
      choice(
        $.nil,
        $.false,
        $.true,
        $.number,
        $.string,
        $.vararg_expression,
        $.function_definition,
        $.prefix_expression,
        $.table,
        $.unary_expression,
        $.binary_expression,
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ["or", PREC.OR],
          ["and", PREC.AND],
          ["==", PREC.COMPARATIVE],
          ["~=", PREC.COMPARATIVE],
          ["<", PREC.COMPARATIVE],
          [">", PREC.COMPARATIVE],
          ["<=", PREC.COMPARATIVE],
          [">=", PREC.COMPARATIVE],
          ["|", PREC.BIT_OR],
          ["~", PREC.BIT_NOT],
          ["&", PREC.BIT_AND],
          ["<<", PREC.BIT_SHIFT],
          [">>", PREC.BIT_SHIFT],
          ["+", PREC.ADDITIVE],
          ["-", PREC.ADDITIVE],
          ["*", PREC.MULTIPLICATIVE],
          ["/", PREC.MULTIPLICATIVE],
          ["//", PREC.MULTIPLICATIVE],
          ["%", PREC.MULTIPLICATIVE],
        ].map(([operator, priority]) =>
          prec.left(
            priority,
            seq(
              field("left", $.expression),
              field("operator", operator),
              field("right", $.expression),
            ),
          ),
        ),
        ...[
          ["..", PREC.CONCATENATION],
          ["^", PREC.POWER],
        ].map(([operator, priority]) =>
          prec.right(
            priority,
            seq(
              field("left", $.expression),
              field("operator", operator),
              field("right", $.expression),
            ),
          ),
        ),
      ),

    unary_expression: ($) =>
      choice(
        ...["not", "#", "-", "~"].map((operator) =>
          prec.left(
            PREC.UNARY,
            seq(field("operator", operator), field("argument", $.expression)),
          ),
        ),
      ),

    table: ($) => seq("{", optional($.field_list), "}"),
    field_list: ($) =>
      seq(_list($.field, $.field_separator), optional($.field_separator)),
    field: ($) =>
      seq(
        optional(
          seq(
            choice(
              field("key", $.identifier),
              seq("[", field("key", $.expression), "]"),
            ),
            "=",
          ),
        ),
        field("value", $.expression),
      ),
    field_separator: () => choice(",", ";"),

    prefix: ($) => choice($.variable, $.call, $.parenthesized_expression),
    prefix_expression: ($) => $.prefix,
    _prefix_expression: ($) => prec(PREC.CALL, $.prefix),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    call: ($) =>
      seq(
        field(
          "function",
          choice(
            $._prefix_expression,
            alias($._table_method_variable, $.variable),
          ),
        ),
        field("arguments", $.argument_list),
      ),
    _table_method_variable: ($) =>
      seq(field("table", $.prefix_expression), $._method_identifier),
    _method_identifier: ($) => seq(":", field("method", $.identifier)),
    argument_list: ($) =>
      choice(seq("(", optional($.expression_list), ")"), $.table, $.string),
    expression_list: ($) => _list($.expression, ","),

    variable: ($) => choice(field("name", $.identifier), $._table_variable),
    _table_variable: ($) =>
      seq(
        field(
          "table",
          choice(
            $.identifier,
            alias($._table_variable, $.variable),
            $.call,
            $.parenthesized_expression,
          ),
        ),
        choice($._indexed_field_identifier, $._named_field_identifier),
      ),
    _named_field_identifier: ($) => seq(".", field("field", $.identifier)),
    _indexed_field_identifier: ($) =>
      seq("[", field("field", $.expression), "]"),

    function_definition: ($) => seq("function", $._function_body),
    _function_body: ($) =>
      seq(
        "(",
        optional(field("parameters", $.lua_parameter_list)),
        ")",
        optional(field("body", $.block)),
        "end",
      ),
    lua_parameter_list: ($) =>
      choice(
        seq(
          _list(field("name", $.identifier), ","),
          optional(seq(",", $.vararg_expression)),
        ),
        $.vararg_expression,
      ),

    vararg_expression: () => "...",

    string: ($) =>
      seq($._string_start, optional($._string_content), $._string_end),

    number: ($) =>
      token(
        seq(
          optional("-"),
          choice(
            seq(_numeral(DECIMAL_DIGIT), optional(_exponent_part("e", "E"))),
            seq(
              choice("0x", "0X"),
              _numeral(HEXADECIMAL_DIGIT),
              optional(_exponent_part("p", "P")),
            ),
          ),
        ),
      ),

    true: () => "true",
    false: () => "false",
    nil: () => "nil",

    identifier: () => IDENTIFIER,

    comment: ($) =>
      seq($._comment_start, optional($._comment_content), $._comment_end),
  },

  extras: ($) => [WHITESPACE, $.comment],

  externals: ($) => [
    $._comment_start,
    $._comment_content,
    $._comment_end,
    $._string_start,
    $._string_content,
    $._string_end,
  ],

  inline: ($) => [$.prefix, $.field_separator],

  supertypes: ($) => [$.prefix_expression, $.expression, $.statement],

  word: ($) => $.identifier,
});
