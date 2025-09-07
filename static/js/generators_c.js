// Use a unique storage key for this codelab
const storageKey = 'jsonGeneratorWorkspace';

// Provide C generator for basic blocks
Blockly.C = new Blockly.Generator('C');

Blockly.C.addReservedWords('main');
Blockly.C.addReservedWords('main_entery');

Blockly.C.init = function(workspace) {
  Blockly.C.definitions_ = {};
  Blockly.C.code_ = '';
};

Object.assign(Blockly.C, {
  ORDER_ATOMIC:        Blockly.JavaScript.ORDER_ATOMIC,
  ORDER_UNARY:         Blockly.JavaScript.ORDER_UNARY,
  ORDER_MULTIPLICATIVE: Blockly.JavaScript.ORDER_MULTIPLICATIVE,
  ORDER_ADDITIVE:      Blockly.JavaScript.ORDER_ADDITIVE,
  ORDER_LOGICAL_NOT:   Blockly.JavaScript.ORDER_LOGICAL_NOT,
  ORDER_RELATIONAL:    Blockly.JavaScript.ORDER_RELATIONAL,
  ORDER_NONE:          Blockly.JavaScript.ORDER_NONE,
  ORDER_LOGICAL_AND:      Blockly.JavaScript.ORDER_LOGICAL_AND,
  ORDER_LOGICAL_OR:       Blockly.JavaScript.ORDER_LOGICAL_OR
});

Blockly.C.finish = function(code) {
  const defs = Object.values(Blockly.C.definitions_).join('\n');
  return defs + '#include <stdbool.h>\n#include <stdint.h>\nint main_entery(void) {\n' + code + '\n  return 0;\n}';
};

Blockly.C.scrub_ = function(block, code) {
  const next = block.nextConnection && block.nextConnection.targetBlock();
  const nextCode = next ? Blockly.C.blockToCode(next) : '';
  return code + '\n' + nextCode;
};

// Generator for repeat block
Blockly.C.forBlock['controls_repeat_ext'] = function(block, generator) {
  const times = Blockly.C.valueToCode(block, 'TIMES', Blockly.C.ORDER_ATOMIC) || '0';
  const branch = Blockly.C.statementToCode(block, 'DO');
  return 'for(int i=0; i<' + times + '; ++i) {\n' + branch + '}';
};




Blockly.C.forBlock['controls_whileUntil'] = function(block) {
  // Read the dropdown: "WHILE" or "UNTIL"
  const mode = block.getFieldValue('MODE');
  // Get the condition expression; use ORDER_NONE so no extra parens
  const condition = Blockly.C.valueToCode(block, 'BOOL', Blockly.C.ORDER_NONE) || '0';
  // Get the loop body
  const body = Blockly.C.statementToCode(block, 'DO');

  let code = '';
  if (mode === 'WHILE') {
    // Standard while loop
    code = 'while (' + condition + ') {\n' + body + '}\n';
  } else {
    // do…while loop: execute body first, then test UNTIL condition
    // Note: UNTIL means "repeat until (cond) is true" i.e. do…while(!cond)
    code = 'do {\n' + body + '} while (!(' + condition + '));\n';
  }
  return code;
};

// Number block
Blockly.C.forBlock['math_number'] = function(block, generator) {
  return [block.getFieldValue('NUM'), Blockly.C.ORDER_ATOMIC];
};

// If block
Blockly.C.forBlock['controls_if'] = function(block, generator) {
  let n = 0;
  let code = '';

  do {
    const condition = Blockly.C.valueToCode(block, 'IF' + n, Blockly.C.ORDER_NONE) || '0';
    const branch = Blockly.C.statementToCode(block, 'DO' + n);
    code += (n === 0 ? 'if' : 'else if') + ' (' + condition + ') {\n' + branch + '}\n';
    n++;
  } while (block.getInput('IF' + n));
  
  if (block.getInput('ELSE')) {
    const elseBranch = Blockly.C.statementToCode(block, 'ELSE');
    code += 'else {\n' + elseBranch + '}\n';
  }
  return code;
};


Blockly.C.forBlock['logic_compare'] = function(block) {
  // Map Blockly dropdown to C operator
  const OPERATORS = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>='
  };
  const opField = block.getFieldValue('OP');
  const operator = OPERATORS[opField];

  // Generate code for left and right inputs
  const order = Blockly.C.ORDER_RELATIONAL;
  const left  = Blockly.C.valueToCode(block, 'A', order) || '0';
  const right = Blockly.C.valueToCode(block, 'B', order) || '0';

  // Return [ codeString, precedenceOrder ]
  const code = `${left} ${operator} ${right}`;
  return [code, order];
};
Blockly.C.forBlock['logic_operation'] = function(block) {
  const mode    = block.getFieldValue('OP');           // "AND" or "OR"
  const operator = (mode === 'AND') ? '&&' : '||';

  const order = (mode === 'AND') 
    ? Blockly.C.ORDER_LOGICAL_AND 
    : Blockly.C.ORDER_LOGICAL_OR;

  const left  = Blockly.C.valueToCode(block, 'A', order) || 'false';
  const right = Blockly.C.valueToCode(block, 'B', order) || 'false';

  const code = `${left} ${operator} ${right}`;
  return [code, order];
};

Blockly.C.forBlock['logic_negate'] = function(block) {
  const order = Blockly.C.ORDER_UNARY;
  const argument = Blockly.C.valueToCode(block, 'BOOL', order) || 'false';
  const code = `!${argument}`;
  return [code, order];
};


  
// Ensure your C generator has its ORDER constants set up...
// (see previous discussion for how to import Blockly.JavaScript.ORDER_* into Blockly.C)

// Boolean block → returns [ codeString, orderNumber ]
Blockly.C.forBlock['logic_boolean'] = function(block, generator) {
  // Get the raw field, either "TRUE" or "FALSE"
  const fieldVal = block.getFieldValue('BOOL');

  // Map to C boolean literal
  const code = (fieldVal === 'TRUE') ? 'true' : 'false';

  // Atomic order is appropriate for a literal
  return [code, Blockly.C.ORDER_ATOMIC];
};

// Text block => as string literal
Blockly.C.forBlock['text'] = function(block) {
  return ['"' + block.getFieldValue('TEXT') + '"', Blockly.C.ORDER_ATOMIC];
};
