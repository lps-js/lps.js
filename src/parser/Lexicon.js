/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

module.exports = {
  whitespaces: '\n\r\t '.split(''),
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
    'fail',
    'from',
    'to',
    'at',
    'cut'
  ],
  constantDelimiterEscapeChar: '\\',
  constantInvalidCharacters: '\r\n\f\b\v'.split(''),
  constantUnicodeMarker: 'u',
  constantHexadecimalMarker: 'x',
  singleCharacterMarkers: {
    n: '\n',
    t: '\t',
    r: '\r',
    f: '\f',
    v: '\v',
    '\\': '\\',
    '\'': '\'',
    '"': '"'
  },

  unquotedConstantStartTest: /^[^A-Z_()[\],.\s]$/,
  unquotedConstantBodyTest: /^[^()[\]\\+*/\-,.\s]$/,
  variableStartTest: /^[A-Z_]$/,
  variableBodyTest: /^[0-9a-zA-Z_]$/,
  numberStartTest: /^[0-9]$/,
  hexadecimalTest: /[0-9a-fA-F]/,
  binaryTest: /[01]/,
  decimalSymbol: '.',
  numberBinaryMarker: 'b',
  numberHexadecimalMarker: 'x',
  numberPositiveExponentialMarker: 'e+',
  numberNegativeExponentialMarker: 'e-'
};
