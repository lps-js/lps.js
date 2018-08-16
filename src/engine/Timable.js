/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');

const timableName = 'occurs';

function Timable(goal, startTimeArg, endTimeArg) {
  let startTime = startTimeArg;
  let endTime = endTimeArg;

  this.getName = function getName() {
    return timableName;
  };

  this.getArguments = function getArguments() {
    return [goal, startTime, endTime];
  };

  this.getArgumentCount = function getArguments() {
    return 3;
  };

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

  this.isAnytime = function isAnytime() {
    return startTime instanceof Variable;
  };

  this.substitute = function substitute(theta) {
    let updatedGoal = goal.substitute(theta);
    let newStartTime = startTime.substitute(theta);
    let newEndTime = endTime.substitute(theta);
    return new Timable(updatedGoal, newStartTime, newEndTime);
  };

  this.getVariables = function getVariables() {
    return Object.keys(this.getVariableHash());
  };

  this.getVariableHash = function getVariableHash(existingHash) {
    let hash = existingHash;
    if (hash === undefined) {
      hash = {};
    }

    if (startTime instanceof Variable) {
      hash[startTime.evaluate()] = true;
    }
    if (endTime instanceof Variable) {
      hash[endTime.evaluate()] = true;
    }

    goal.getVariableHash(hash);

    return hash;
  };

  this.isEarlierThan = function isEarlierThan(other) {
    // if either start time is a variable, then both are equal
    let otherStartTime = other.getStartTime();
    if (startTime instanceof Variable
        || otherStartTime instanceof Variable) {
      return false;
    }

    return startTime.evaluate() < otherStartTime.evaluate();
  };

  this.isLaterThan = function isLaterThan(other) {
    // if either start time is a variable, then both are equal
    let otherStartTime = other.getStartTime();
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
