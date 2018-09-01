/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');
const Timable = lpsRequire('engine/Timable');

const resolveTimableThetaTiming = function resolveTimableThetaTiming(conjunct, thetaArg, forTime) {
  let thetaDelta = {};
  if (!(conjunct instanceof Timable)) {
    return thetaDelta;
  }
  let theta = thetaArg;
  let conjunctStartTime = conjunct.getStartTime();
  let conjunctEndTime = conjunct.getEndTime();
  let isConjunctStartTimeVariable = conjunctStartTime instanceof Variable;
  let isConjunctEndTimeVariable = conjunctEndTime instanceof Variable;

  if (isConjunctStartTimeVariable && isConjunctEndTimeVariable) {
    let startTimeVarName = conjunctStartTime.evaluate();
    let endTimeVarName = conjunctEndTime.evaluate();
    if (startTimeVarName === endTimeVarName) {
      // fluent
      theta[startTimeVarName] = new Value(forTime);
      thetaDelta[startTimeVarName] = new Value(forTime);
    } else {
      // action or event
      theta[startTimeVarName] = new Value(forTime - 1);
      thetaDelta[startTimeVarName] = new Value(forTime - 1);
      theta[endTimeVarName] = new Value(forTime);
      thetaDelta[endTimeVarName] = new Value(forTime);
    }
  } else if (isConjunctEndTimeVariable) {
    let endTimeVarName = conjunctEndTime.evaluate();
    theta[endTimeVarName] = new Value(conjunctStartTime.evaluate() + 1);
    thetaDelta[endTimeVarName] = new Value(conjunctStartTime.evaluate() + 1);
  }
  return thetaDelta;
};

module.exports = resolveTimableThetaTiming;
