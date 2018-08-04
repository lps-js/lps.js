const LPS = lpsRequire('LPS');

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

let testFunction = function testFunction(file) {
  describe(file + '.lps', () => {
    it('should pass all expectations', function (done) {
      LPS.load(path.join(__dirname, file + '.lps'))
        .then((engine) => {
          this.timeout(engine.getMaxTime() * engine.getCycleInterval() + 1000);
          return engine.test(path.join(__dirname, file + '.spec.lps'));
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
    'ballot',
    'fire-simple',
    'fire-recurrent',
    'guard',
    'quickSort',
    'initiates-constraint',
    'rain',
    'goat',
    'findall',
    'towers-simple'
  ].forEach(testFunction);
});
