const NEWLINE_CHAR = '\n';

module.exports = function unexpectedTokenErrorMessage(source, currentToken) {
  let lineIndex = currentToken.line;
  let sourceLength = source.length;

  let currentLineIndex = 0;
  let sourcePointerIndex = 0;
  let lineStartIndex = -1;
  let lineEndIndex = -1;
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

  let message = '';
  let line = source.substring(lineStartIndex, lineEndIndex);
  let tokenType = String(currentToken.type).slice(7, -1) || 'undefined';

  message += 'Syntax Error: Unexpected token \'' + currentToken.value
    + '\' of type ' + tokenType + ' found at line ' +
    (currentToken.line + 1) + ', col ' + (currentToken.col + 1) + '\n';
  message += '\n';
  message += currentToken.file + ': ' + (currentToken.line + 1) + '\n';
  message += line + '\n' + ' '.repeat(currentToken.col) + '^' + '\n';
  return message;
};
