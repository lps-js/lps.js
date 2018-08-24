/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../lpsRequire');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const Value = lpsRequire('engine/Value');
const stringLiterals = lpsRequire('utility/strings');

const observeLiteral = ProgramFactory.literal('observe(O, ST, ET)');

// eslint-disable-next-line no-unused-vars
function observeProcessor(engine, program) {
  let result = engine.query(observeLiteral);
  result.forEach((r) => {
    if (r.theta.O === undefined
        || r.theta.ST === undefined
        || r.theta.ET === undefined) {
      // ignoring those undefined ones
      return;
    }
    let observation = r.theta.O;
    let startTime = r.theta.ST;
    let endTime = r.theta.ET;

    if (!(startTime instanceof Value)) {
      throw new Error(stringLiterals([
        'declarationProcessors',
        'observe',
        'invalidStartTimeValue'
      ]));
    }
    if (!(endTime instanceof Value)) {
      throw new Error(stringLiterals([
        'declarationProcessors',
        'observe',
        'invalidEndTimeValue'
      ]));
    }
    let sTime = startTime.evaluate();
    let eTime = endTime.evaluate();
    if (eTime < sTime) {
      throw new Error(stringLiterals([
        'declarationProcessors',
        'observe',
        'invalidTimeOrdering'
      ]));
    }
    engine.scheduleObservation(observation, sTime, eTime);
  });
}

module.exports = observeProcessor;
