/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const AstNode = lpsRequire('parser/AstNode');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

describe('AstNode', () => {
  describe('constructor', () => {
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

  describe('setToken()', () => {
    it('should change the token', () => {
      let symbol = Symbol();
      let token1 = {};
      let token2 = { test: true };
      let node = new AstNode(symbol, token1);
      expect(node.getToken()).to.be.equal(token1);
      node.setToken(token2);
      expect(node.getToken()).to.be.equal(token2);
    });
  });

  describe('print()', () => {
    it('should print out', function () {
      this.sinon.stub(console, 'log');
      let symbol = Symbol();
      let token = { value: '.' };
      let node = new AstNode(symbol, token);
      node.print();
      expect(console.log.calledOnce).to.be.true;
      this.sinon.restore();
    });

    it('should print out with indentation', function () {
      this.sinon.stub(console, 'log');
      let symbol = Symbol();
      let token = { value: '.' };
      let node = new AstNode(symbol, token);
      node.print(2);
      expect(console.log.calledOnce).to.be.true;
      this.sinon.restore();
    });

    it('should print out with no token', function () {
      this.sinon.stub(console, 'log');
      let symbol = Symbol();
      let node = new AstNode(symbol, null);
      node.print();
      expect(console.log.calledOnce).to.be.true;
      this.sinon.restore();
    });

    it('should print out children recursively', function () {
      let child = {
        print: () => {}
      };
      this.sinon.stub(console, 'log');
      this.sinon.stub(child, 'print').value((n) => {
        expect(n).to.be.equal(1);
        console.log('testing');
      });
      let symbol = Symbol();
      let token = { value: '.' };
      let node = new AstNode(symbol, token);
      node.addChild(child);
      node.print();
      expect(console.log.calledTwice).to.be.true;
      this.sinon.restore();
    });
  });
});
