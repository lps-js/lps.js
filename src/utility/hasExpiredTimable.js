const Value = require('../engine/Value');

module.exports = function hasExpiredTimable(conjunction, program, currentTime) {
  let hasExpired = false;
  conjunction.forEach((conjunct) => {
    if (!program.isTimable(conjunct)) {
      return;
    }

    let conjunctArgs = conjunct.getArguments();
    if (program.isFluent(conjunct)) {
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
