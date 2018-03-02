const Functor = require('./Functor');
const Value = require('./Value');
const Variable = require('./Variable');

let processNewSubstitution = function processNewSubstitution(newVar, newValue, thetaArg) {
  let theta = thetaArg;
  let thetaP = {};
  thetaP[newVar] = newValue;
  Object.keys(theta).forEach((key) => {
    theta[key] = theta[key].substitute(thetaP);
  });
  theta[newVar] = newValue;
  return theta;
}

let processEquality = function processEquality(queue, equality, thetaArg) {
  if (equality.length != 2) {
    return null;
  }

  if (typeof equality[0]['substitute'] === 'undefined'
      || typeof equality[1]['substitute'] === 'undefined') {
    return null;
  }

  let theta = thetaArg;
  let leftOperand = equality[0].substitute(theta);
  let rightOperand = equality[1].substitute(theta);

  if (leftOperand instanceof Value && rightOperand instanceof Value) {
    if (leftOperand.evaluate() === rightOperand.evaluate()) {
      return theta;
    }
    // no substitution available between two terms of different value.
    return null;
  }

  if (leftOperand instanceof Functor && rightOperand instanceof Functor) {
    // must have same name and number of arguments
    if (leftOperand.getId() === rightOperand.getId()) {
      let leftOperandArgs = leftOperand.getArguments();
      let rightOperandArgs = rightOperand.getArguments();
      for (let i = 0; i < leftOperandArgs.length; i += 1) {
        queue.push([leftOperandArgs[i], rightOperandArgs[i]]);
      }
      return theta;
    }
    return null;
  }

  // we swap the order for processing
  if ((leftOperand instanceof Functor || leftOperand instanceof Value)
      && rightOperand instanceof Variable) {
    let temp = leftOperand;
    leftOperand = rightOperand;
    rightOperand = temp;
  }

  if (leftOperand instanceof Variable
      && (rightOperand instanceof Functor || rightOperand instanceof Value)) {
    let varName = leftOperand.evaluate();
    if (rightOperand.getVariables().indexOf(varName) === -1) {
      return processNewSubstitution(varName, rightOperand, theta);
    }
    return null;
  }

  if (leftOperand instanceof Variable && rightOperand instanceof Variable) {
    if (leftOperand.evaluate() == rightOperand.evaluate()) {
      return theta;
    }
    let varName = leftOperand.evaluate();
    return processNewSubstitution(varName, rightOperand, theta);
  }

  return null;
};

function Unifier(equalities, thetaArg) {
  let theta = thetaArg;
  if (!theta) {
    theta = {};
  }

  let queue = [];
  equalities.forEach((equality) => queue.push(equality));

  while (queue.length > 0) {
    let equality = queue.shift();
    theta = processEquality(queue, equality, theta);
    if (!theta) {
      return null;
    }
  }
  return theta;
}

module.exports = Unifier;
