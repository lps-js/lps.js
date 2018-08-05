const LPS = lpsRequire('LPS');

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

let testFunction = function testFunction(file, updateTimeout) {
  let errors = [];
  return LPS.load(path.join(__dirname, file + '.lps'))
    .then((engine) => {
      engine.on('error', (err) => {
        errors.push(err);
      });
      updateTimeout(engine.getMaxTime() * engine.getCycleInterval());
      return engine.test(path.join(__dirname, file + '.spec.lps'));
    })
    .then((result) => {
      if (!result.success) {
        console.log(result.errors);
      }
      if (errors.length > 0) {
        console.log(errors);
      }
      expect(errors.length).to.be.equal(0);
      expect(result.success).to.be.true;
    });
};

describe('Programs Test', function () {
  this.retries(3);

  let files = [
    'party',
    'bank-terse',
    'badlight2',
    'ballot',
    'binary-search',
    'binary-search2',
    'fire-simple',
    'fire-recurrent',
    'guard',
    'quickSort',
    'initiates-constraint',
    'rain',
    'goat',
    'mark-hiccup',
    'findall',
    'towers-simple',
    'dining-philosophers',
    'map-colouring',
    'rock-paper-scissors-minimal'
  ];

  files.forEach((file) => {
    it('should test ' + file + '.lps', function (done) {
      let updateTimeout = (timeout) => {
        this.slow((0.8 * timeout) + 1000);
        this.timeout(timeout + 1000);
      };

      testFunction(file, updateTimeout)
        .then(() => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});
