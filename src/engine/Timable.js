const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');

function Timable(goal, startTimeArg, endTimeArg) {
  let startTime = startTimeArg;
  let endTime = endTimeArg;

  this.getGoal = function getGoal() {
    return goal;
  };

  this.getStartTime = function getStartTime() {
    return startTime;
  };

  this.getEndTime = function getEndTime() {
    return endTime;
  };

  this.isInRange = function isInRange(currentTime) {
    return (startTime instanceof Variable)
        || (startTime instanceof Value
          && startTime.evaluate() === currentTime);
  };

  this.hasExpired = function hasExpired(currentTime) {
    return endTime instanceof Value
      && endTime.evaluate() < currentTime;
  };

  this.update = function update(theta) {
    if (startTime instanceof Variable
        && theta[startTime.evaluate()] !== undefined) {
      startTime = theta[startTime.evaluate()];
    }
    if (endTime instanceof Variable
        && theta[endTime.evaluate()] !== undefined) {
      endTime = theta[endTime.evaluate()];
    }
  };

  this.isEarlierThan = function isEarlierThan(other) {
    // if either start time is a variable, then both are equal
    let otherStartTime = other.getStartTime()
    if (startTime instanceof Variable
        || otherStartTime instanceof Variable) {
      return false;
    }

    return startTime.evaluate() < otherStartTime.evaluate();
  };

  this.isLaterThan = function isLaterThan(other) {
    // if either start time is a variable, then both are equal
    let otherStartTime = other.getStartTime()
    if (startTime instanceof Variable
        || otherStartTime instanceof Variable) {
      return false;
    }

    return startTime.evaluate() > otherStartTime.evaluate();
  };

  this.toString = function toString() {
    return 'occurs(' + goal + ', ' + startTime + ', ' + endTime + ')';
  };
}

module.exports = Timable;
