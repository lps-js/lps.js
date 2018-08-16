/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

/**
 * Perform sequential scanning and lookahead for a piece of source code
 * @param       {string} source   The source code to be scanned
 * @param       {string} [pathname] The path name of the original file being scanned
 * @constructor
 */
function Scanner(source) {
  let _line = 0;
  let _col = -1;
  let _lastIndex = source.length - 1;
  let _currentIndex = -1;
  let _source = source;

  let _makeChar = (c, line, col, idx) => {
    return {
      c: c,
      line: line || _line,
      col: col || _col,
      index: idx || _currentIndex
    };
  };

  /**
   * Get the next character and advance the scanner pointer
   * @return {Object} Return the object representation of the character read
   */
  this.get = function get() {
    _currentIndex += 1;

    if (_currentIndex > _lastIndex) {
      _currentIndex = _lastIndex + 1;
      return _makeChar(null);
    }
    if (_currentIndex > 0 && _source[_currentIndex - 1] === '\n') {
      _line += 1;
      _col = -1;
    }
    _col += 1;

    return _makeChar(_source[_currentIndex]);
  };

  /**
   * Look ahead and retrieve the next character without advancing the scanner pointer
   * @return {Object} Return the object representation of the character read
   */
  this.lookahead = function lookahead() {
    let lookaheadIdx = _currentIndex + 1;
    let lookaheadLine = _line;
    let lookaheadCol = _col;

    if (lookaheadIdx > 0 && _source[lookaheadIdx - 1] === '\n') {
      lookaheadLine += 1;
      lookaheadCol = -1;
    }
    lookaheadCol += 1;

    let char = null;
    if (lookaheadIdx <= _lastIndex) {
      char = _source[lookaheadIdx];
    }
    return _makeChar(char, lookaheadLine, lookaheadCol, lookaheadIdx);
  };
}

module.exports = Scanner;
