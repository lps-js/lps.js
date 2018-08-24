/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../src/lpsRequire');
const Lexer = lpsRequire('parser/Lexer');
const TokenTypes = lpsRequire('parser/TokenTypes');

/**
 * The LPS minification loader for webpack.
 * Removes not-needed whitespace to reduce bytes for browser bundling
 * @param  {string} source The initial source loaded
 * @return {string}        Returns the resulting output for loading LPS file.
 */
module.exports = function(source) {
  // tokenize the file, then reconstruct without the whitespace
  let lexer = new Lexer(source);

  let currentToken = lexer.get();
  let minSource = '';
  while (currentToken.type !== TokenTypes.Eof) {
    minSource += currentToken.value;
    currentToken = lexer.get();
  }

  return 'module.exports = ' + JSON.stringify(minSource) + ';';
};
