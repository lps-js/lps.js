const AstNode = require('../../src/parser/AstNode');
const NodeTypes = require('../../src/parser/NodeTypes');
const Parser = require('../../src/parser/Parser');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

describe('Parser', () => {
  describe('parseLiteral', () => {
    it('should parse and return a literal correctly', () => {
      let literal = 'test(X, Y)';
      Parser.parseLiteral(literal)
        .then((node) => {
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
});
