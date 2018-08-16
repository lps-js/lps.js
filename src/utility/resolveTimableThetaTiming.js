/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

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
  if (conjunctStartTime instanceof Variable) {
    let startTimeVarName = conjunctStartTime.evaluate();
    theta[startTimeVarName] = new Value(forTime);
    thetaDelta[startTimeVarName] = new Value(forTime);
  }
  if (conjunctEndTime instanceof Variable) {
    let endTimeVarName = conjunctEndTime.evaluate();
    if (!(conjunctStartTime instanceof Variable)
        || endTimeVarName !== conjunctStartTime.evaluate()) {
      if (conjunctStartTime instanceof Value) {
        theta[endTimeVarName] = new Value(conjunctStartTime.evaluate() + 1);
        thetaDelta[endTimeVarName] = new Value(conjunctStartTime.evaluate() + 1);
      } else {
        theta[endTimeVarName] = new Value(forTime + 1);
        thetaDelta[endTimeVarName] = new Value(forTime + 1);
      }
    }
  }
  return thetaDelta;
};

module.exports = resolveTimableThetaTiming;
