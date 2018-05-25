const Lexer = require('./Lexer');
const AstNode = require('./AstNode');
const NodeTypes = require('./NodeTypes');
const TokenTypes = require('./TokenTypes');

const END_OF_CLAUSE_SYMBOL = '.';
const CLAUSE_LITERAL_SEPARATOR_SYMBOL = ',';
const ARGUMENT_SEPARATOR_SYMBOL = ',';

function Parser(source) {
  let _lexer = new Lexer(source);
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

  let _expect = function _expect(type) {
    if (currentToken.type !== type) {
      throw new Error('Expecting type ' + String(type) + ', but found ' + String(currentToken.type) + ' instead at line ' + currentToken.line + ' col ' + currentToken.col + '.');
    }
    _nextToken();
  };

  let _expectToBe = function _expectToBe(type, content) {
    if (currentToken.type !== type) {
      throw new Error('Expecting type ' + String(type) + ', but found ' + String(currentToken.type) + ' instead at line ' + currentToken.line + ' col ' + currentToken.col + '.');
    }
    if (currentToken.value !== content) {
      throw new Error('Expecting type ' + String(type) + ' of "' + content + '", but found "' + String(currentToken.value) + '" instead at line ' + currentToken.line + ' col ' + currentToken.col + '.');
    }
    _nextToken();
  };

  let _arguments;
  let _expression;

  let _functorOrConstantExpression = function _functorOrConstantExpression() {
    let nameToken = currentToken;
    _expect(TokenTypes.Constant);
    if (_foundToBe(TokenTypes.Symbol, '(')) {
      // we assume a bracket to symbolize a function
      _expect(TokenTypes.Symbol);
      let funcNode = new AstNode(NodeTypes.Functor, nameToken);
      _arguments(funcNode);
      return funcNode;
    }
    return new AstNode(NodeTypes.Constant, nameToken);
  };

  let _simpleExpression = function _simpleExpression() {
    let node;
    if (_foundToBe(TokenTypes.Symbol, '(')) {
      node = _expression();
      _expectToBe(TokenTypes.Symbol, ')');
    } else if (_found(TokenTypes.Constant)) {
      node = _functorOrConstantExpression();
    } else if (_found(TokenTypes.Variable)) {
      node = new AstNode(NodeTypes.Variable, currentToken);
      _expect(TokenTypes.Variable);
    } else {
      node = new AstNode(NodeTypes.Number, currentToken);
      _expect(TokenTypes.Number);
    }
    return node;
  };

  let _unaryExpression = function _unaryExpression() {
    if (_foundToBe(TokenTypes.Keyword, 'not')) {
      let node = new AstNode(NodeTypes.UnaryOperator, currentToken);
      _expect(TokenTypes.Keyword);
      node.addChild(_unaryExpression());
      return node;
    }
    if (_foundOneOf(TokenTypes.Symbol, ['!', '-'])) {
      let node = new AstNode(NodeTypes.UnaryOperator, currentToken);
      _expect(TokenTypes.Symbol);
      node.addChild(_unaryExpression());
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

  let _arrayExpression = function _arrayExpression() {
    _expect(TokenTypes.Symbol); // opening [
    let node = new AstNode(NodeTypes.List);
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
    _expect(TokenTypes.Symbol);
    return node;
  };

  _expression = function () {
    if (_foundToBe(TokenTypes.Symbol, '[')) {
      return _arrayExpression();
    }
    return _comparisonExpression();
  };

  _arguments = function (node) {
    node.addChild(_expression());
    while (_foundToBe(TokenTypes.Symbol, ARGUMENT_SEPARATOR_SYMBOL)) {
      _expect(TokenTypes.Symbol);
      node.addChild(_expression());
    }
    _expect(TokenTypes.Symbol, ')');
  };

  let _literal = function _literal() {
    return _expression();
  };

  let _logicalExpression = function _logicalExpression() {
    let node = new AstNode(NodeTypes.LiteralSet);
    if (_foundToBe(TokenTypes.Keyword, 'true')) {
      _expect(TokenTypes.Keyword);
      return node;
    }
    node.addChild(_literal());
    while (_foundToBe(TokenTypes.Symbol, CLAUSE_LITERAL_SEPARATOR_SYMBOL)) {
      _expect(TokenTypes.Symbol);
      node.addChild(_literal());
    }
    return node;
  };

  let _clause = function _clause() {
    let clauseNode = new AstNode(NodeTypes.Clause);
    let hasImplicationSymbol = true;

    if (_foundToBe(TokenTypes.Symbol, '<-')) {
      clauseNode.addChild(new AstNode(NodeTypes.Symbol, currentToken));
      _expect(TokenTypes.Symbol);
    } else if (_foundToBe(TokenTypes.Symbol, '->')) {
      clauseNode.addChild(new AstNode(NodeTypes.Symbol, currentToken));
      _expect(TokenTypes.Symbol);
    } else {
      clauseNode.addChild(_logicalExpression());
      if (_foundToBe(TokenTypes.Symbol, '<-') || _foundToBe(TokenTypes.Symbol, '->')) {
        clauseNode.addChild(new AstNode(NodeTypes.Symbol, currentToken));
        _expect(TokenTypes.Symbol);
      } else {
        hasImplicationSymbol = false;
      }
    }
    if (hasImplicationSymbol) {
      clauseNode.addChild(_logicalExpression());
    }
    _expect(TokenTypes.Symbol, END_OF_CLAUSE_SYMBOL);
    return clauseNode;
  };

  let _program = function _program() {
    let node = new AstNode(NodeTypes.Program);
    while (!_found(TokenTypes.Eof)) {
      node.addChild(_clause());
    }
    return node;
  };

  this.buildClause = function buildClause() {
    if (_root) {
      return _root;
    }
    _root = _clause();
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

Parser.parseClause = function parseLiteral(clause) {
  let parser = new Parser(clause);
  let token = parser.buildClause();
  return token;
};

Parser.parseLiteral = function parseLiteral(literal) {
  let parser = new Parser(literal);
  let token = parser.buildLiteral();
  return token;
};

module.exports = Parser;
