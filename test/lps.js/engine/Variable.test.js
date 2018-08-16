/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Variable', () => {
  describe('evaluate()', () => {
    it('should return the variable name', () => {
      let variable = new Variable('X');
      expect(variable.evaluate).to.be.a('function');

      expect(variable.evaluate()).to.be.equals('X');
    });
  });

  describe('getVariables()', () => {
    it('should return an array containing itself', () => {
      let variable = new Variable('X');
      expect(variable.getVariables).to.be.a('function');

      expect(variable.getVariables()).to.be.not.empty;
      expect(variable.getVariables()[0]).to.be.equal('X');
    });
  });

  describe('isGround()', () => {
    it('should return false anyway', () => {
      let variable = new Variable('X');
      expect(variable.isGround).to.be.a('function');

      expect(variable.isGround()).to.be.equal(false);
    });
  });

  describe('toString()', () => {
    it('should return string representation', () => {
      let variable = new Variable('VarName');
      expect(variable.toString).to.be.a('function');

      expect(variable.toString()).to.be.equal('VarName');
    });
  });

  describe('substitute()', () => {
    it('should return the substituted variable if theta contains it', () => {
      let variable = new Variable('X');
      expect(variable.substitute).to.be.a('function');

      let theta = { X: new Value(5) };
      expect(variable.substitute(theta)).to.be.instanceof(Value);
      expect(variable.substitute(theta)).to.be.equals(theta.X);
      expect(variable.substitute(theta).evaluate()).to.be.equals(5);
    });

    it('should return the substituted variable if theta contains it', () => {
      let variable = new Variable('X');
      expect(variable.substitute).to.be.a('function');

      let theta = { Y: new Value(5) };
      expect(variable.substitute(theta)).to.be.instanceof(Variable);
      expect(variable.substitute(theta).evaluate()).to.be.equals('X');
    });
  });
});
