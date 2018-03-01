const AstNode = require('../../src/parser/AstNode');

const chai = require('chai');
const expect = chai.expect;

describe('AstNode', () => {
  describe('initialize AstNode', () => {
    it('should initialise correct with type and token', () => {
      let symbol = Symbol();
      let token = {};
      let node = new AstNode(symbol, token);
      expect(node.getType()).to.be.equal(symbol);
      expect(node.getToken()).to.be.equal(token);
    });
  });
});
