const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Variable', () => {

  describe('evaluate', () => {
    it('should return the variable name', () => {
      let value = new Variable('X');
      expect(value.evaluate).to.be.a('function');

      expect(value.evaluate()).to.be.equals("X");
    });
  });

  describe('substitute', () => {
    it('should return the substituted value if theta contains it', () => {
      let value = new Variable('X');
      expect(value.substitute).to.be.a('function');

      let theta = {X : new Value(5)};
      expect(value.substitute(theta)).to.be.instanceof(Value);
      expect(value.substitute(theta)).to.be.equals(theta['X']);
      expect(value.substitute(theta).evaluate()).to.be.equals(5);
    });
      it('should return the substituted value if theta contains it', () => {
        let value = new Variable('X');
        expect(value.substitute).to.be.a('function');

        let theta = {Y : new Value(5)};
        expect(value.substitute(theta)).to.be.instanceof(Variable);
        expect(value.substitute(theta).evaluate()).to.be.equals('X');
      });
  });

});
