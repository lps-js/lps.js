const LPS = require('../../index');

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

let testFunction = function testFunction(file, updateTimeout, done) {
  let errors = [];
  return LPS.loadFile(path.join(__dirname, file + '.lps'))
    .then((engine) => {
      engine.on('error', (err) => {
        done(err);
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
    'ballot-chain',
    'bank-terse',
    'badlight2',
    'ballot',
    'binary-search',
    'binary-search2',
    'fire-simple',
    'fire-recurrent',
    'guard',
    'halting',
    'quickSort',
    'movement',
    'initiates-constraint',
    'numeric-notation',
    'rain',
    'shopping',
    'turing',
    'randomHalt',
    'goat',
    'mark-hiccup',
    'findall',
    'trash',
    'towers-simple',
    'towers',
    'dining-philosophers',
    'map-colouring',
    'rock-paper-scissors-minimal'
  ];

  files.forEach((file) => {
    it('should test ' + file + '.lps', function (done) {
      let updateTimeout = (timeout) => {
        this.slow((0.75 * timeout) + 2000);
        this.timeout(timeout + 2000);
      };

      testFunction(file, updateTimeout, done)
        .then(() => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});
