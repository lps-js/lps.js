/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const stringLiterals = lpsRequire('utility/strings');

const NEWLINE_CHAR = '\n';

const getLines = function getLines(source, lineNumbersArg) {
  let lineNumbers = lineNumbersArg.concat();
  lineNumbers.sort();

  let currentLineIndex = 0;
  let sourcePointerIndex = -1;
  let sourceLength = source.length;

  let lineStartIndex = -1;
  let lineEndIndex = -1;

  let result = [];

  while (sourcePointerIndex < sourceLength) {
    sourcePointerIndex += 1;
    if (source[sourcePointerIndex] !== NEWLINE_CHAR) {
      continue;
    }
    // new line character
    currentLineIndex += 1;
    if (currentLineIndex === lineNumbers[0] + 1) {
      lineEndIndex = sourcePointerIndex;
      result.push(source.substring(lineStartIndex + 1, lineEndIndex));
      lineNumbers.shift();
      lineStartIndex = -1;
      lineEndIndex = -1;
      if (lineNumbers.length === 0) {
        break;
      }
    }

    if (currentLineIndex === lineNumbers[0]) {
      lineStartIndex = sourcePointerIndex;
    }
  }
  if (lineStartIndex > -1 && lineEndIndex === -1) {
    // last line
    lineEndIndex = sourceLength - 1;
    result.push(source.substring(lineStartIndex + 1, lineEndIndex));
  }
  return result;
};

module.exports = function unexpectedTokenErrorMessage(source, currentToken, likelyMissing) {
  let lineIndex = currentToken.line;

  let numLines = source.split(NEWLINE_CHAR).length;
  // extract the line where the error occurred
  let lineNumbers = [];
  if (lineIndex > 0) {
    lineNumbers.push(lineIndex - 1);
  }
  lineNumbers.push(lineIndex);
  if (lineIndex < numLines - 1) {
    lineNumbers.push(lineIndex + 1);
  }
  let lines = getLines(source, lineNumbers);
  let lineOutput = '';
  lines.forEach((line, idx) => {
    // console.log('"'+line+'"')
    lineOutput += '\t' + (lineNumbers[idx] + 1) + ' | ' + line + '\n';
    if (lineNumbers[idx] === lineIndex) {
      lineOutput += '\t    ' + ' '.repeat(currentToken.col) + '^\n';
    }
  });

  let tokenType = String(currentToken.type).slice(7, -1) || 'undefined';

  let messageKey = 'parser.syntaxError';
  if (process.browser) {
    messageKey = 'parser.syntaxErrorBrowser';
  }

  let message = stringLiterals(
    messageKey,
    currentToken.value,
    tokenType,
    currentToken.line + 1,
    currentToken.col + 1,
    currentToken.file,
    currentToken.line + 1,
    lineOutput
  );
  if (likelyMissing !== undefined) {
    message += stringLiterals('parser.likelyMissingInfo', likelyMissing);
  }
  return message;
};
