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

  let _foundOneOf = function _foundOneOf(types) {
    return types.indexOf(currentToken.type) > -1;
  };

  let _expect = function _expect(type) {
    if (currentToken.type !== type) {
      throw new Error('Expecting type ' + String(type) + ', but found ' + String(currentToken.type) + ' instead.');
    }
    _nextToken();
  };

  let _expectToBe = function _expectToBe(type, content) {
    if (currentToken.type !== type) {
      throw new Error('Expecting type ' + String(type) + ', but found ' + String(currentToken.type) + ' instead.');
    }
    if (currentToken.value !== content) {
      throw new Error('Expecting type ' + String(type) + ' of "' + content + '", but found "' + String(currentToken.value) + '" instead.');
    }
    _nextToken();
  };

  let _expression = function _expression() {
    // an expression could be just a single number
    let node = new AstNode(NodeTypes.Expression);
    if (_foundToBe(TokenTypes.Symbol, '(')) {
      _expect(TokenTypes.Symbol);
      node.addChild(_expression())
      _expectToBe(TokenTypes.Symbol, ')');
    } else if (_found(TokenTypes.Number)) {
      node.addChild(new AstNode(NodeTypes.Number, currentToken));
      _expect(TokenTypes.Number);
    }
    node.addChild(new AstNode(NodeTypes.Symbol, currentToken));
    _expect(TokenTypes.Symbol);
    if (_foundToBe(TokenTypes.Symbol, '(')) {
      _expect(TokenTypes.Symbol);
      node.addChild(_expression())
      _expectToBe(TokenTypes.Symbol, ')');
    } else if (_found(TokenTypes.Number)) {
      node.addChild(new AstNode(NodeTypes.Number, currentToken));
      _expect(TokenTypes.Number);
    }
    return node;
  };

  let _argument = function _argument() {
    if (_found(TokenTypes.Constant)) {
      // could be a constant or function name
      let nameToken = currentToken;
      _expect(TokenTypes.Constant);
      // check if there is a bracket
      if (_foundToBe(TokenTypes.Symbol, '(')) {
        // we assume a bracket to symbolize a function
        _expect(TokenTypes.Symbol);
        let funcNode = new AstNode(NodeTypes.Function);
        funcNode.addChild(new AstNode(NodeTypes.FunctionName, nameToken));
        funcNode.addChild(_arguments());
        return funcNode;
      }
      return new AstNode(TokenTypes.Constant, nameToken);
    }
    if (_found(TokenTypes.Variable)) {
      let varNode = new AstNode(TokenTypes.Variable, currentToken);
      _expect(TokenTypes.Variable);
      return varNode;
    }
    // bracket delimited expression
    return _expression();
  }

  let _arguments = function _arguments() {
    let node = new AstNode(NodeTypes.Arguments);
    node.addChild(_argument());
    while (_foundToBe(TokenTypes.Symbol, ARGUMENT_SEPARATOR_SYMBOL)) {
      _expect(TokenTypes.Symbol);
      node.addChild(_argument());
    }
    _expect(TokenTypes.Symbol, ')');
    return node;
  };

  let _literal = function _literal() {
    let node = new AstNode(NodeTypes.Literal);
    if (_foundToBe(TokenTypes.Symbol, '!')) {
      node.addChild(new AstNode(NodeTypes.Symbol, currentToken));
      _expect(TokenTypes.Symbol);
    }
    node.addChild(new AstNode(NodeTypes.LiteralName, currentToken));
    _expect(TokenTypes.Constant);
    if (_foundToBe(TokenTypes.Symbol, '(')) {
      _expect(TokenTypes.Symbol);
      node.addChild(_arguments());
    }
    return node;
  };

  let _literalSet = function _literalSet() {
    let node = new AstNode(NodeTypes.LiteralSet);
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
      clauseNode.addChild(_literalSet());
      if (_foundToBe(TokenTypes.Symbol, '<-') || _foundToBe(TokenTypes.Symbol, '->')) {
        clauseNode.addChild(new AstNode(NodeTypes.Symbol, currentToken));
        _expect(TokenTypes.Symbol);
      } else {
        hasImplicationSymbol = false;
      }
    }
    if (hasImplicationSymbol) {
      clauseNode.addChild(_literalSet());
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

  this.build = function build() {
    if (_root) {
      return _root;
    }
    _root = _program();
    return _root;
  };
}

module.exports = Parser;
