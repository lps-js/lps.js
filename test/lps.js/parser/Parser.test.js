/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const AstNode = lpsRequire('parser/AstNode');
const NodeTypes = lpsRequire('parser/NodeTypes');
const Parser = lpsRequire('parser/Parser');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

describe('Parser', () => {
  describe('parseLiteral', () => {
    it('should parse and return a literal correctly', () => {
      let literal = 'test(X, Y)';
      let node = Parser.parseLiteral(literal);
      expect(node).to.be.instanceof(AstNode);
      expect(node.getType()).to.be.equal(NodeTypes.Functor);
      let children = node.getChildren();
      expect(children).to.be.length(2);
      expect(children[0]).to.be.instanceof(AstNode);
      expect(children[0].getType()).to.be.equal(NodeTypes.Variable);
      expect(children[1]).to.be.instanceof(AstNode);
      expect(children[1].getType()).to.be.equal(NodeTypes.Variable);
    });
  });
});
