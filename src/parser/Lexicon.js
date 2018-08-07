module.exports = {
  whitespaces: '\n\t '.split(''),
  comments: [
    ['/*', '*/'],
    ['%', '\n'],
    ['#', '\n']
  ],
  singleSymbols: [
    '(', // start of arguments or tuple
    ')', // start of arguments or tuple
    '.', // end of clause
    ';', // OR operator
    ',', // argument separator or AND operator
    '-', // subtraction / binary or negation / unary
    '+', // addition / binary
    '*', // multiplication / binary
    '=', // unify / binary
    '/', // division / binary
    '^', // power to / binary
    '>', // more than / binary
    '<', // less than / binary
    '!', // negation / unary
    '[', // list start
    ']', // list end
    '|' // head/tail separator
  ],
  doubleSymbols: [
    '->', // implies / binary
    '<-', // implied by / binary
    '<=', // less than or equal / binary
    '>=', // more than or equal / binary
    '!=', // not equals / binary
    '==', // equals
    '**', // power
    '@<',
    '@>',
    '@='
  ],
  constantDelimiters: [
    '\'',
    '"'
  ],
  keywords: [
    'not',
    'true',
    'false',
    'fail'
  ],
  constantDelimiterEscapeChar: '\\',
  unquotedConstantStartTest: /^[a-z]$/,
  unquotedConstantBodyTest: /^[a-zA-Z0-9-_]$/,
  variableStartTest: /^[A-Z_]$/,
  variableBodyTest: /^[0-9a-zA-Z_]$/,
  numberStartTest: /^[0-9]$/,
  decimalSymbol: '.',
  numberBinaryMarker: 'b',
  numberHexadecimalMarker: 'x',
  numberPositiveExponentialMarker: 'e+',
  numberNegativeExponentialMarker: 'e-',
};
