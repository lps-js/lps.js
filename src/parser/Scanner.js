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
