; Keywords

[
  "script"
  "extends"
  "end"
  "property"
  "member"
  "constructor"
  "operator"
  "static"
  "readonly"
] @keyword

["method" "emitter" "handler" "function" "local"] @keyword.function

"return" @keyword.return

[(break_statement) (continue_statement)] @keyword
"goto" @keyword

(label_statement) @label

["if" "then" "elseif" "else"] @keyword.conditional

["while" "repeat" "until" "for" "in" "do"] @keyword.repeat

"@" @punctuation.special

; Operators and punctuation

(binary_expression operator: _ @operator)
(unary_expression operator: _ @operator)
(compound_assignment_statement operator: _ @operator)

"=" @operator

["and" "or" "not"] @keyword.operator

[";" ":" "," "." "::"] @punctuation.delimiter

["(" ")" "[" "]" "{" "}" "<" ">"] @punctuation.bracket

; Literals

(number) @number
(string) @string
(comment) @comment
[(true) (false)] @boolean
(nil) @constant.builtin
(vararg_expression) @constant

; Variables -- deliberately placed *before* the declaration-context captures
; below: this file follows the org-required "last wins" query precedence
; (CONTRIBUTING.md), so a generic `(identifier) @variable` catch-all placed
; *after* a field-specific capture (e.g. `(decorator name: (identifier)
; @attribute)`) would silently win over it for every decorator/property/
; method/etc. name -- confirmed as a real bug while writing test/highlight/
; basics.mlua, not a hypothetical ordering concern.

(identifier) @variable

((identifier) @variable.builtin
  (#eq? @variable.builtin "self"))

((identifier) @constant
  (#match? @constant "^[A-Z][A-Z_0-9]*$"))

; Types

(type name: (identifier) @type)
(script_declaration name: (identifier) @type)

; Declarations

(decorator name: (identifier) @attribute)
(property_declaration name: (identifier) @property)
(member_declaration name: (identifier) @constant)
(method_declaration name: (identifier) @function.method)
(constructor_declaration name: (identifier) @constructor)
(operator_declaration name: (identifier) @function.method)
(emitter_declaration name: (identifier) @function.method)
(handler_declaration name: (identifier) @function.method)
(parameter name: (identifier) @variable.parameter)

(call
  function: (variable name: (identifier) @function.call))
(call
  function: (variable field: (identifier) @function.method.call))

(variable
  field: (identifier) @field)
