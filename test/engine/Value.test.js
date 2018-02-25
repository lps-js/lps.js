const Value = require('../../src/engine/Value');

const chai = require('chai');
const expect = chai.expect;

describe('Value', () => {

  describe('evaluate', () => {
    it('should return the value correctly with a constant', () => {
      let value = new Value('testing');
      expect(value.evaluate).to.be.a('function');

      expect(value.evaluate()).to.be.equals("testing");
    });
  });

});
