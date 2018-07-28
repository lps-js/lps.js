const LPS = require('../../src/LPS');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

let testFunction = function testFunction(file) {
  describe(file + '.lps', () => {
    it('should pass all expectations', function (done) {
      this.timeout(5000);
      LPS.load(__dirname + '/' + file + '.lps')
        .then((engine) => {
          return engine.test(__dirname + '/' + file + '.spec.lps');
        })
        .then((result) => {
          if (!result.success) {
            console.log(result.errors);
          }
          expect(result.success).to.be.true;
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
};

describe('Programs Test', () => {
  [
    'party',
    'bank-terse',
    'fire-simple',
    'fire-recurrent',
    'guard',
    'quickSort',
    'initiates-constraint',
    'rain',
    'goat'
  ].forEach(testFunction);
});
