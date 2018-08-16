/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const stringLiterals = lpsRequire('utility/strings');

const NEWLINE_CHAR = '\n';

module.exports = function unexpectedTokenErrorMessage(source, currentToken, likelyMissing) {
  let lineIndex = currentToken.line;
  let sourceLength = source.length;

  let currentLineIndex = 0;
  let sourcePointerIndex = 0;
  let lineStartIndex = -1;
  let lineEndIndex = -1;
  // extract the line where the error occurred
  while (sourcePointerIndex < sourceLength) {
    if (source[sourcePointerIndex] === NEWLINE_CHAR) {
      currentLineIndex += 1;
      if (currentLineIndex === lineIndex) {
        lineStartIndex = sourcePointerIndex + 1;
      } else if (currentLineIndex === lineIndex + 1) {
        lineEndIndex = sourcePointerIndex;
      }
    }
    sourcePointerIndex += 1;
  }
  if (lineEndIndex === -1) {
    // last line
    lineEndIndex = sourceLength - 1;
  }

  let line = source.substring(lineStartIndex, lineEndIndex);
  let tokenType = String(currentToken.type).slice(7, -1) || 'undefined';

  let message = stringLiterals(
    'parser.syntaxError',
    currentToken.value,
    tokenType,
    currentToken.line + 1,
    currentToken.col + 1,
    currentToken.file,
    currentToken.line + 1,
    line,
    ' '.repeat(currentToken.col) + '^'
  );
  if (likelyMissing !== undefined) {
    message += stringLiterals('parser.likelyMissingInfo', likelyMissing);
  }
  return message;
};
