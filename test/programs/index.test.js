const LPS = require('../../src/LPS');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

let testFunction = function testFunction(file) {
  describe(file, () => {
    it('should pass all expectations', (done) => {
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
        });
    });
  });
};

describe('Programs Test', () => {
  [
    'bank-terse',
    'fire-simple',
    'fire-recurrent',
    'guard',
    'quickSort'
  ].forEach(testFunction);
});
