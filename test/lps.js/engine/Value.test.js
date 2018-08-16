/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');

const chai = require('chai');
const expect = chai.expect;

describe('Value', () => {
  describe('evaluate()', () => {
    it('should return the value correctly with a constant string', () => {
      let value = new Value('testing');
      expect(value.evaluate).to.be.a('function');

      expect(value.evaluate()).to.be.equals('testing');
    });

    it('should return the value correctly with a number', () => {
      let value = new Value(43);
      expect(value.evaluate).to.be.a('function');

      expect(value.evaluate()).to.be.equals(43);
    });
  });

  describe('getVariables()', () => {
    it('should return empty array', () => {
      let value = new Value('testing');
      expect(value.getVariables).to.be.a('function');

      expect(value.getVariables()).to.be.empty;
    });
  });

  describe('isGround()', () => {
    it('should return true anyway', () => {
      let value = new Value('testing');
      expect(value.isGround).to.be.a('function');

      expect(value.isGround()).to.be.equal(true);
    });
  });

  describe('substitute()', () => {
    it('should just return a copy of itself', () => {
      let value = new Value('testing');
      expect(value.substitute).to.be.a('function');

      let theta = {};
      expect(value.substitute(theta)).to.be.not.equals(value);
      expect(value.substitute(theta).evaluate()).to.be.equals(value.evaluate());
    });

    it('should work with non-empty theta and just return a copy of itself', () => {
      let value = new Value('testing');
      expect(value.substitute).to.be.a('function');

      let theta = { testing: 5 };
      expect(value.substitute(theta)).to.be.not.equals(value);
      expect(value.substitute(theta).evaluate()).to.be.equals(value.evaluate());
    });
  });

  describe('toString()', () => {
    it('should return correct string quoted', () => {
      let value = new Value('testing');
      expect(value.toString).to.be.a('function');
      expect(value.toString()).to.be.equal('"testing"');
    });

    it('should return correct numeric string quoted', () => {
      let value = new Value('5');
      expect(value.toString).to.be.a('function');
      expect(value.toString()).to.be.equal('"5"');
    });

    it('should return correct string', () => {
      let value = new Value(5);
      expect(value.toString).to.be.a('function');
      expect(value.toString()).to.be.equal(5);
    });
  });
});
