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
    
    
    if (_currentIndex > _lastIndex) {
      return makeChar(null);
    }
    
    return _makeChar(_source[_currentIndex]);
  }
}

module.exports = Scanner;
