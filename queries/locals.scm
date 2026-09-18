; Scopes
[
  (chunk)
  (script_declaration)
  (do_statement)
  (while_statement)
  (repeat_statement)
  (if_statement)
  (for_numeric_statement)
  (for_generic_statement)
  (method_declaration)
  (constructor_declaration)
  (operator_declaration)
  (emitter_declaration)
  (handler_declaration)
  (function_definition)
  (function_definition_statement)
  (local_function_definition_statement)
] @local.scope

; Definitions
(local_variable_declaration
  (variable_list
    (variable
      name: (identifier) @local.definition)))

(for_generic_statement
  left: (variable_list
    (identifier) @local.definition))

(for_numeric_statement
  name: (identifier) @local.definition)

(parameter
  name: (identifier) @local.definition)

(property_declaration
  name: (identifier) @local.definition)

(method_declaration
  name: (identifier) @local.definition)

(constructor_declaration
  name: (identifier) @local.definition)

; References
(identifier) @local.reference
