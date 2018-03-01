const AstNode = require('../../src/parser/AstNode');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

describe('AstNode', () => {
  describe('initialize AstNode', () => {
    it('should initialise correct with type and token', () => {
      let symbol = Symbol();
      let token = {};
      let node = new AstNode(symbol, token);
      expect(node.getType()).to.be.equal(symbol);
      expect(node.getToken()).to.be.equal(token);
      expect(node.getChildren()).to.be.an('array');
      expect(node.getChildren()).to.be.empty;
      expect(node.isLeaf()).to.be.equal(true);
    });
  });

  describe('setToken', () => {
    it('should change the token', () => {
      let symbol = Symbol();
      let token1 = {};
      let token2 = {'test': true};
      let node = new AstNode(symbol, token1);
      expect(node.getToken()).to.be.equal(token1);
      node.setToken(token2);
      expect(node.getToken()).to.be.equal(token2);
    });
  });

  describe('print', () => {
    it('should change the token', function() {
      this.sinon.stub(console, 'log');
      let symbol = Symbol();
      let token = {'value': '.'};
      let node = new AstNode(symbol, token);
      node.print();
      expect( console.log.calledOnce ).to.be.true;
      this.sinon.restore();
    });
  });
});
