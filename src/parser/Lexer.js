const Scanner = require('./Scanner');
const Lexicon = require('./Lexicon');
const TokenTypes = require('./TokenTypes');

function Lexer(source) {
  let _scanner = new Scanner(source);

  let _nextChar = function _nextChar() {
    let c1 = _scanner.get();
    // lookahead to construct the next two characters for processing two char
    let c2 = null;
    let lookahead = _scanner.lookahead();
    if (lookahead.c != null) {
      c2 = c1.c + lookahead.c;
    }
    return [c1.c, c2, c1];
  };

  let _skipWhitespaces = function _skipWhitespaces(charsArg) {
    let chars = charsArg;
    let c1 = chars[0];
    while (Lexicon.whitespaces.indexOf(c1) > -1) {
      chars = _nextChar();
      c1 = chars[0];
    }
    return chars;
  };

  let _skipComments = function _skipComments(charsArg) {
    let chars = charsArg;
    let c1 = chars[0];
    let c2 = chars[1];

    let filterFunction = x => x[0] === c1 || x[0] === c2;

    let commentEntry = Lexicon.comments.filter(filterFunction);
    while (commentEntry.length > 0) {
      let commentStart = commentEntry[0][0];
      let commentEnd = commentEntry[0][1];
      chars = _nextChar();
      if (commentStart.length === 2) {
        // if there were two characters in the comment start, we skip twice
        chars = _nextChar();
      }
      c1 = chars[0];
      c2 = chars[1];

      while (c1 !== commentEnd && c2 !== commentEnd && c1 !== null) {
        chars = _nextChar();
        c1 = chars[0];
        c2 = chars[1];
      }
      // EOF reached before comment terminated.
      if (c1 === null) {
        break;
      }
      chars = _nextChar();
      if (commentEnd.length === 2) {
        // if there were two characters in the comment start, we skip twice
        chars = _nextChar();
      }
      c1 = chars[0];
      c2 = chars[1];

      commentEntry = Lexicon.comments.filter(filterFunction);
    }
    return chars;
  };

  let _skipWhitespaceAndComments = function _skipWhitespaceAndComments(charsArg) {
    let chars = charsArg;
    let newChars = chars;
    do {
      chars = newChars;
      newChars = _skipWhitespaces(newChars);
      newChars = _skipComments(newChars);
    } while (newChars !== chars);
    return chars;
  };

  let _makeToken = function _makeToken(type, content, line, col) {
    return {
      type: type,
      value: content,
      line: line,
      col: col
    };
  };

  let _makeErrorToken = function _makeErrorToken(message, line, col) {
    return {
      type: TokenTypes.Error,
      value: message,
      line: line,
      col: col
    };
  };

  let _extractContentByRegexTest = function _extractContentByTest(charsArg, regex) {
    let chars = charsArg;
    let buffer = chars[0];
    while (chars[1] != null && regex.test(chars[1][1])) {
      chars = _nextChar();
      buffer += chars[0];
    }
    return buffer;
  };

  let _extractNumber = function _extractNumber(chars) {
    // keep record of where the token starts
    let line = chars[2].line;
    let col = chars[2].col;
    let content = _extractContentByRegexTest(chars, Lexicon.numberBodyTest);
    return _makeToken(TokenTypes.Number, content, line, col);
  };

  let _extractVariable = function _extractVariable(chars) {
    // keep record of where the token starts
    let line = chars[2].line;
    let col = chars[2].col;
    let content = _extractContentByRegexTest(chars, Lexicon.variableBodyTest);
    return _makeToken(TokenTypes.Variable, content, line, col);
  };

  let _extractUnquotedConstant = function _extractUnquotedConstant(chars) {
    // keep record of where the token starts
    let line = chars[2].line;
    let col = chars[2].col;
    let content = _extractContentByRegexTest(chars, Lexicon.unquotedConstantBodyTest);
    return _makeToken(TokenTypes.Constant, content, line, col);
  };

  let _extractQuotedConstant = function _extractQuotedConstant(charsArg) {
    let buffer = '';
    let chars = charsArg;
    let line = chars[2].line;
    let col = chars[2].col;
    let delimiter = chars[0];
    while (chars[1] !== null && chars[1][1] !== delimiter) {
      chars = _nextChar();
      if (chars[0] === Lexicon.constantDelimiterEscapeChar) {
        if (chars[1][1] !== delimiter && chars[1][1] !== Lexicon.constantDelimiterEscapeChar) {
          return _makeErrorToken('Invalid escape character', chars[2].line, chars[2].col);
        }
        chars = _nextChar();
      }
      buffer += chars[0];
    }
    if (chars[1] !== null && chars[1][1] === delimiter) {
      // skip over the closing delimiter
      _nextChar();
    }
    return _makeToken(TokenTypes.Constant, buffer, line, col);
  };

  let _extractDoubleSymbol = function _extractDoubleSymbol(charsArg) {
    _nextChar();
    return _makeToken(TokenTypes.Symbol, charsArg[1], charsArg[2].line, charsArg[2].col);
  };

  let _extractSingleSymbol = function _extractSingleSymbol(charsArg) {
    return _makeToken(TokenTypes.Symbol, charsArg[0], charsArg[2].line, charsArg[2].col);
  };

  this.get = function get() {
    let chars = _nextChar();
    chars = _skipWhitespaceAndComments(chars);
    let c1 = chars[0];
    let c2 = chars[1];

    if (c1 == null) { // end of file check
      return _makeToken(TokenTypes.Eof, null, chars[2].line, chars[2].col);
    }

    // check if next token is a number
    if (Lexicon.numberStartTest.test(c1)) {
      return _extractNumber(chars);
    }

    if (Lexicon.variableStartTest.test(c1)) {
      return _extractVariable(chars);
    }

    if (Lexicon.unquotedConstantStartTest.test(c1)) {
      return _extractUnquotedConstant(chars);
    }

    if (Lexicon.constantDelimiters.indexOf(c1) > -1) {
      return _extractQuotedConstant(chars);
    }

    if (Lexicon.doubleSymbols.indexOf(c2) > -1) {
      return _extractDoubleSymbol(chars);
    }

    if (Lexicon.singleSymbols.indexOf(c1) > -1) {
      return _extractSingleSymbol(chars);
    }

    return _makeErrorToken('Invalid character \'' + c1 + '\'', chars[2].line, chars[2].col);
  };
}

module.exports = Lexer;
