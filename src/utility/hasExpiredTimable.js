const Value = require('../engine/Value');
const Functor = require('../engine/Functor');

module.exports = function hasExpiredTimable(conjunction, program, currentTime) {
  let hasExpired = false;
  conjunction.forEach((conjunct) => {
    if (!program.isTimable(conjunct)) {
      return;
    }
    let literal = conjunct;
    // unfold negation
    while (literal instanceof Functor && literal.getId() === '!/1') {
      literal = literal.getArguments()[0];
    }

    let conjunctArgs = literal.getArguments();
    if (program.isFluent(literal)) {
      let timeArg = conjunctArgs[conjunctArgs.length - 1];
      if (timeArg instanceof Value && timeArg.evaluate() <= currentTime) {
        hasExpired = true;
        return
      }
    } else {
      let startTimeArg = conjunctArgs[conjunctArgs.length - 2];
      if (startTimeArg instanceof Value && startTimeArg.evaluate() <= currentTime) {
        hasExpired = true;
        return
      }
      let endTimeArg = conjunctArgs[conjunctArgs.length - 1];
      if (endTimeArg instanceof Value && endTimeArg.evaluate() <= currentTime) {
        hasExpired = true;
        return
      }
    }
  });
  return hasExpired;
};
