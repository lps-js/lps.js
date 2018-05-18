const LPS = require('../../src/LPS');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');


describe('Programs Test', () => {
  describe('bank-terse', () => {
    it('should pass all expectations', (done) => {
      LPS.load(__dirname + '/bank-terse.lps')
        .then((engine) => {
          return engine.test(__dirname + '/bank-terse.spec.lps');
        })
        .then((result) => {
          expect(result.success).to.be.true;
          done();
        });
    });
  });
});
