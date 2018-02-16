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
    '-', // subtraction / binary
    '+', // addition / binary
    '*', // multiplication / binary
    '=', // equality / binary
    '/', // division / binary
    '^', // power to / binary
    '>', // more than / binary
    '<', // less than / binary
    '!' // negation / unary
  ],
  doubleSymbol: [
    '->', // implies / binary
    '<-', // implied by / binary
    '<=', // less than or equal / binary
    '>=' // more than or equal / binary
  ]
};
