const LPS = require('../../src/LPS');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

let testFunction = function testFunction(file, done) {
  LPS.load(__dirname + '/' + file + '.lps')
    .then((engine) => {
      return engine.test(__dirname + '/' + file + '.spec.lps');
    })
    .then((result) => {
      expect(result.success).to.be.true;
      done();
    });
}

describe('Programs Test', () => {
  describe('bank-terse', () => {
    it('should pass all expectations', (done) => {
      testFunction('bank-terse', done);
    });
  });
});
