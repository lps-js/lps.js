const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');
const Timable = lpsRequire('engine/Timable');

const resolveTimableThetaTiming = function resolveTimableThetaTiming(conjunct, theta, forTime) {
  if (!(conjunct instanceof Timable)) {
    return;
  }
  let conjunctStartTime = conjunct.getStartTime();
  let conjunctEndTime = conjunct.getEndTime();
  if (conjunctStartTime instanceof Variable) {
    let startTimeVarName = conjunctStartTime.evaluate();
    theta[startTimeVarName] = new Value(forTime);
  }
  if (conjunctEndTime instanceof Variable) {
    let endTimeVarName = conjunctEndTime.evaluate();
    if (!(conjunctStartTime instanceof Variable)
        || endTimeVarName !== conjunctStartTime.evaluate()) {
      if (conjunctStartTime instanceof Value) {
        theta[endTimeVarName] = new Value(conjunctStartTime.evaluate() + 1);
      } else {
        theta[endTimeVarName] = new Value(forTime + 1);
      }
    }
  }
};

module.exports = resolveTimableThetaTiming;
