const Variable = lpsRequire('engine/Variable');

function TimableHelper() {

}

TimableHelper.getFluentTime = function getFluentTime(fluent) {
  if (fluent.getArgumentCount() < 1) {
    throw new Error('Invalid parameter given for TimableHelper.getFluentTime()');
  }
  let fluentArgs = fluent.getArguments();
  return fluentArgs[fluentArgs.length - 1];
};

TimableHelper.isFluentGround = function isFluentGround(fluent) {
  if (fluent.getArgumentCount() < 1) {
    throw new Error('Invalid parameter given for TimableHelper.isFluentTimeGround()');
  }
  let fluentArgs = fluent.getArguments();
  return !(fluentArgs[fluentArgs.length - 1] instanceof Variable);
};

TimableHelper.getActionStartTime = function getActionStartTime(action) {
  if (action.getArgumentCount() < 2) {
    throw new Error('Invalid parameter given for TimableHelper.getActionStartTime()');
  }
  let actionArgs = action.getArguments();
  return actionArgs[actionArgs.length - 2];
};

TimableHelper.getActionEndTime = function getActionEndTime(action) {
  if (action.getArgumentCount() < 2) {
    throw new Error('Invalid parameter given for TimableHelper.getActionEndTime()');
  }
  let actionArgs = action.getArguments();
  return actionArgs[actionArgs.length - 1];
};

module.exports = TimableHelper;
