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
    ++_currentIndex;
    
    
    if (_currentIndex > 0 && _source[_currentIndex - 1] == "\n") {
      ++_line;
      _col = -1;
    }
    ++_col;
    
    
    let char = null;
    if (_currentIndex <= _lastIndex) {
      char = _source[_currentIndex];
    }
    
    return _makeChar(char);
  }
  
  this.lookahead = function lookahead() {
    let lookaheadIdx = _currentIndex + 1;
    let lookaheadLine = _line;
    let lookaheadCol = _col;
    
    if (lookaheadIdx > 0 && _source[lookaheadIdx - 1] == "\n") {
      ++lookaheadLine;
      lookaheadCol = -1;
    }
    ++lookaheadCol;
    
    let char = null;
    if (lookaheadIdx <= _lastIndex) {
      char = _source[lookaheadIdx];
    }
    return _makeChar(char, lookaheadLine, lookaheadCol, lookaheadIdx);
  };
}

module.exports = Scanner;
