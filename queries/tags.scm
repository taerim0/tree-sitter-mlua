(script_declaration
  name: (identifier) @name) @definition.class

(method_declaration
  name: (identifier) @name) @definition.method

(constructor_declaration
  name: (identifier) @name) @definition.method

(operator_declaration
  name: (identifier) @name) @definition.method

(emitter_declaration
  name: (identifier) @name) @definition.method

(handler_declaration
  name: (identifier) @name) @definition.method

(function_definition_statement
  name: (identifier) @name) @definition.function

(local_function_definition_statement
  name: (identifier) @name) @definition.function

(property_declaration
  name: (identifier) @name) @definition.property

(member_declaration
  name: (identifier) @name) @definition.constant

(call
  function: (variable name: (identifier) @name)) @reference.call
