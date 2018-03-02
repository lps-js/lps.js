const Value = require('../../src/engine/Value');

const chai = require('chai');
const expect = chai.expect;

describe('Value', () => {
  describe('evaluate', () => {
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

  describe('substitute', () => {
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
});
