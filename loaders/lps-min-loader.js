require('../src/LPS');
const Lexer = lpsRequire('parser/Lexer');
const TokenTypes = lpsRequire('parser/TokenTypes');

module.exports = function(source, map, meta) {
  let lexer = new Lexer(source);

  let currentToken = lexer.get();
  let minSource = '';
  while (currentToken.type !== TokenTypes.Eof) {
    minSource += currentToken.value;
    currentToken = lexer.get();
  }

  return 'module.exports = ' + JSON.stringify(minSource) + ';';
};
