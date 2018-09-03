/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const LPS = lpsRequire('LPS');
const Tester = lpsRequire('engine/tester/Tester');

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

let testFunction = function testFunction(file, updateTimeout, done) {
  let errors = [];
  let engineError = false;
  return LPS.loadFile(path.join(__dirname, file + '.lps'))
    .then((engine) => {
      engine.on('error', (err) => {
        engineError = true;
        done(err);
      });
      updateTimeout(engine.getMaxTime() * engine.getCycleInterval());
      let tester = new Tester(engine);
      let specFile = path.join(__dirname, file + '.spec.lps');
      return tester.test(specFile);
    })
    .then((result) => {
      if (!result.success) {
        console.log(result.errors);
      }
      if (errors.length > 0) {
        console.log(errors);
      }
      if (engineError) {
        return;
      }
      expect(errors.length).to.be.equal(0);
      expect(result.success).to.be.true;
      done();
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
    'bubbleSort',
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
    'mark',
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
        this.slow((0.5 * timeout) + 500);
        this.timeout(timeout + 2000);
      };

      testFunction(file, updateTimeout, done)
        .catch((err) => {
          done(err);
        });
    });
  });
});
