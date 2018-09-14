/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Lexer = lpsRequire('parser/Lexer');
const AstNode = lpsRequire('parser/AstNode');
const NodeTypes = lpsRequire('parser/NodeTypes');
const TokenTypes = lpsRequire('parser/TokenTypes');

const END_OF_SENTENCE_SYMBOL = '.';
const CONJUNCT_SEPARATOR_SYMBOL = ',';
const ARGUMENT_SEPARATOR_SYMBOL = ',';
const IF_SYMBOL = '<-';
const RULE_SYMBOL = '->';
const NOT_KEYWORD = 'not';

function Parser(source, pathname) {
  let _lexer = new Lexer(source, pathname);
  let _root = null;
  let currentToken = _lexer.get();

  let _nextToken = function _nextToken() {
    currentToken = _lexer.get();
  };

  let _found = function _found(type) {
    return currentToken.type === type;
  };

  let _foundToBe = function _foundToBe(type, content) {
    return currentToken.type === type && currentToken.value === content;
  };

  let _foundOneOf = function _foundOneOf(type, contents) {
    return currentToken.type === type && contents.indexOf(currentToken.value) > -1;
  };

  let _expect = function _expect(type, expected) {
    if (currentToken.type !== type) {
      let error = new Error();
      error.token = currentToken;
      error.likelyMissing = expected;
      throw error;
    }
    _nextToken();
  };

  let _expectToBe = function _expectToBe(type, content) {
    if (currentToken.type !== type
        || currentToken.value !== content) {
      let error = new Error();
      error.token = currentToken;
      throw error;
    }
    _nextToken();
  };

  let _arguments;
  let _expression;

  let _variableOrNumberValueExpression = function _variableOrNumberValueExpression() {
    let node;
    if (_found(TokenTypes.Variable)) {
      node = new AstNode(NodeTypes.Variable, currentToken);
      _expect(TokenTypes.Variable);
    } else {
      node = new AstNode(NodeTypes.Number, currentToken);
      _expect(TokenTypes.Number);
    }
    return node;
  };

  let _processTimableExpression = function _processTimableExpression(goalNode) {
    let node = new AstNode(NodeTypes.Timable, currentToken);
    node.addChild(goalNode);
    if (_foundToBe(TokenTypes.Keyword, 'from')) {
      _expect(TokenTypes.Keyword);
      let startTimeNode = _variableOrNumberValueExpression();
      if (_foundToBe(TokenTypes.Keyword, 'to')) {
        _expect(TokenTypes.Keyword);
        let endTimeNode = _variableOrNumberValueExpression();
        node.addChild(startTimeNode);
        node.addChild(endTimeNode);
      } else {
        node.addChild(startTimeNode);
      }
    } else if (_foundToBe(TokenTypes.Keyword, 'at')) {
      _expect(TokenTypes.Keyword);
      let timeNode = _variableOrNumberValueExpression();
      node.addChild(timeNode);
    } else {
      // unexpected
      throw new Error('Unexpected node ' + currentToken);
    }
    return node;
  };

  let _functorExpression = function _functorExpression() {
    let nameToken = currentToken;
    _expect(TokenTypes.Constant);
    let funcNode = new AstNode(NodeTypes.Functor, nameToken);
    if (_foundToBe(TokenTypes.Symbol, '(')) {
      // functor has arguments
      _arguments(funcNode);
    }
    return funcNode;
  };

  let _stringExpression = function _stringExpression() {
    let node = new AstNode(NodeTypes.Constant, currentToken);
    _expect(TokenTypes.QuotedString);
    return node;
  };

  let _simpleExpression = function _simpleExpression() {
    let node;
    if (_foundToBe(TokenTypes.Symbol, '(')) {
      _expect(TokenTypes.Symbol);
      node = _expression();
      _expectToBe(TokenTypes.Symbol, ')');
    } else if (_found(TokenTypes.Constant)) {
      node = _functorExpression();
    } else if (_found(TokenTypes.QuotedString)) {
      node = _stringExpression();
    } else {
      node = _variableOrNumberValueExpression();
    }
    return node;
  };

  let _unaryExpression = function _unaryExpression() {
    if (_foundToBe(TokenTypes.Keyword, NOT_KEYWORD)) {
      let node = new AstNode(NodeTypes.UnaryOperator, currentToken);
      _expect(TokenTypes.Keyword);
      node.addChild(_unaryExpression());
      return node;
    }
    if (_foundOneOf(TokenTypes.Symbol, ['!', '-'])) {
      let node = new AstNode(NodeTypes.UnaryOperator, currentToken);
      _expect(TokenTypes.Symbol);
      let childNode = _unaryExpression();
      if (node.getToken().value === '-'
          && childNode.getType() === NodeTypes.Number) {
        // dealing with a negative number
        childNode.getToken().value = -childNode.getToken().value;
        return childNode;
      }
      node.addChild(childNode);
      return node;
    }
    return _simpleExpression();
  };

  let _multiplicationExpression = function _multiplicationExpression() {
    let expr = _unaryExpression();
    while (_foundOneOf(TokenTypes.Symbol, ['**', '*', '/'])) {
      let node = new AstNode(NodeTypes.BinaryOperator, currentToken);
      _expect(TokenTypes.Symbol);
      node.addChild(expr);
      let rightExpr = _unaryExpression();
      node.addChild(rightExpr);
      expr = node;
    }
    return expr;
  };

  let _additionExpression = function _additionExpression() {
    let expr = _multiplicationExpression();
    while (_foundOneOf(TokenTypes.Symbol, ['+', '-'])) {
      let node = new AstNode(NodeTypes.BinaryOperator, currentToken);
      _expect(TokenTypes.Symbol);
      node.addChild(expr);
      let rightExpr = _multiplicationExpression();
      node.addChild(rightExpr);
      expr = node;
    }
    return expr;
  };

  let _comparisonExpression = function _comparisonExpression() {
    let expr = _additionExpression();
    while (_foundOneOf(TokenTypes.Symbol, ['==', '<=', '>=', '!=', '<', '>', '@<', '@>', '@='])) {
      let node = new AstNode(NodeTypes.BinaryOperator, currentToken);
      _expect(TokenTypes.Symbol);
      node.addChild(expr);
      let rightExpr = _additionExpression();
      node.addChild(rightExpr);
      expr = node;
    }
    return expr;
  };

  let _assignmentExpression = function _assignmentExpression() {
    let expr = _comparisonExpression();
    if (_foundOneOf(TokenTypes.Symbol, ['='])) {
      let node = new AstNode(NodeTypes.BinaryOperator, currentToken);
      _expect(TokenTypes.Symbol);
      node.addChild(expr);
      let rightExpr = _expression();
      node.addChild(rightExpr);
      expr = node;
    }
    return expr;
  };

  let _arrayExpression = function _arrayExpression() {
    let node = new AstNode(NodeTypes.List, currentToken);
    _expect(TokenTypes.Symbol); // opening [
    if (_foundToBe(TokenTypes.Symbol, ']')) {
      // case of empty array
      _expect(TokenTypes.Symbol);
      return node;
    }

    let headNode = new AstNode(NodeTypes.ListHead);
    node.addChild(headNode);
    // otherwise we expect at least one element of the list inside
    headNode.addChild(_expression());
    while (_foundToBe(TokenTypes.Symbol, ',')) {
      _expect(TokenTypes.Symbol);
      headNode.addChild(_expression());
    }

    // process tail
    if (_foundToBe(TokenTypes.Symbol, '|')) {
      // a tail of the list exists
      _expect(TokenTypes.Symbol);
      // check if tail is a list
      if (_foundToBe(TokenTypes.Symbol, '[')) {
        node.addChild(_arrayExpression());
      } else { // otherwise we expect only a variable
        let tailNode = new AstNode(NodeTypes.Variable, currentToken);
        node.addChild(tailNode);
        _expect(TokenTypes.Variable);
      }
    }
    // the ending ']'
    _expectToBe(TokenTypes.Symbol, ']');
    return node;
  };

  _expression = function () {
    if (_foundToBe(TokenTypes.Symbol, '[')) {
      return _arrayExpression();
    }
    return _assignmentExpression();
  };

  _arguments = function (node) {
    _expect(TokenTypes.Symbol);
    node.addChild(_expression());
    while (_foundToBe(TokenTypes.Symbol, ARGUMENT_SEPARATOR_SYMBOL)) {
      _expect(TokenTypes.Symbol);
      node.addChild(_expression());
    }
    _expect(TokenTypes.Symbol, ')');
  };

  let _literal = function _literal() {
    if (_foundToBe(TokenTypes.Keyword, NOT_KEYWORD)) {
      let node = new AstNode(NodeTypes.Negation, currentToken);
      _expect(TokenTypes.Keyword);
      node.addChild(_literal());
      return node;
    }
    let expr = _expression();
    if (_foundOneOf(TokenTypes.Keyword, ['from', 'at'])) {
      // a timable expression
      expr = _processTimableExpression(expr);
    }
    return expr;
  };

  let _conjunction = function _conjunction() {
    let node = new AstNode(NodeTypes.Conjunction);
    if (_foundToBe(TokenTypes.Keyword, 'true')) {
      _expect(TokenTypes.Keyword);
      return node;
    }
    node.addChild(_literal());
    while (_foundToBe(TokenTypes.Symbol, CONJUNCT_SEPARATOR_SYMBOL)) {
      _expect(TokenTypes.Symbol);
      node.addChild(_literal());
    }
    return node;
  };

  let _sentence = function _sentence() {
    let sentenceNode = new AstNode(NodeTypes.Sentence);
    let hasImplicationSymbol = true;

    if (_foundToBe(TokenTypes.Symbol, IF_SYMBOL)) {
      sentenceNode.addChild(new AstNode(NodeTypes.Symbol, currentToken));
      _expect(TokenTypes.Symbol);
    } else if (_foundToBe(TokenTypes.Symbol, RULE_SYMBOL)) {
      sentenceNode.addChild(new AstNode(NodeTypes.Symbol, currentToken));
      _expect(TokenTypes.Symbol);
    } else {
      sentenceNode.addChild(_conjunction());
      if (_foundToBe(TokenTypes.Symbol, IF_SYMBOL)
          || _foundToBe(TokenTypes.Symbol, RULE_SYMBOL)) {
        sentenceNode.addChild(new AstNode(NodeTypes.Symbol, currentToken));
        _expect(TokenTypes.Symbol);
      } else {
        hasImplicationSymbol = false;
      }
    }
    if (hasImplicationSymbol) {
      sentenceNode.addChild(_conjunction());
    }
    _expectToBe(TokenTypes.Symbol, END_OF_SENTENCE_SYMBOL);
    return sentenceNode;
  };

  let _program = function _program() {
    let node = new AstNode(NodeTypes.Program);
    while (!_found(TokenTypes.Eof)) {
      node.addChild(_sentence());
    }
    return node;
  };

  this.buildSentence = function buildSentence() {
    if (_root) {
      return _root;
    }
    _root = _sentence();
    return _root;
  };

  this.buildConjunction = function buildConjunction() {
    if (_root) {
      return _root;
    }
    _root = _conjunction();
    return _root;
  };

  this.buildLiteral = function buildLiteral() {
    if (_root) {
      return _root;
    }
    _root = _literal();
    return _root;
  };

  this.build = function build() {
    // return cached version if rebuilding using the same source
    if (_root) {
      return _root;
    }
    _root = _program();
    return _root;
  };
}

Parser.parseSentence = function parseSentence(sentence) {
  let parser = new Parser(sentence);
  let token = parser.buildSentence();
  return token;
};

Parser.parseConjunction = function parseConjunction(str) {
  let parser = new Parser(str);
  let token = parser.buildConjunction();
  return token;
};

Parser.parseLiteral = function parseLiteral(literal) {
  let parser = new Parser(literal);
  let token = parser.buildLiteral();
  return token;
};

module.exports = Parser;
