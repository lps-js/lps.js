const Clause = require('./Clause');
const Functor = require('./Functor');
const Unifier = require('./Unifier');
const Variable = require('./Variable');
const BooleanBinaryOperator = require('./BooleanBinaryOperator');
const BooleanUnaryOperator = require('./BooleanUnaryOperator');
const variableArrayRename = require('../utility/variableArrayRename');

function Resolutor() {

}

Resolutor.compactTheta = function compactTheta(theta1, theta2) {
  let theta = {};
  Object.keys(theta1).forEach((key) => {
    let substitution = theta1[key];
    while (substitution instanceof Variable && theta2[substitution.evaluate()]) {
      substitution = theta2[substitution.evaluate()];
    }
    theta[key] = substitution;
  });
  Object.keys(theta2).forEach((key) => {
    let substitution = theta2[key];
    // while (substitution instanceof Variable && theta1[substitution.evaluate()]) {
      // substitution = theta1[substitution.evaluate()];
    //}
    theta[key] = substitution;
  })
  return theta;
};

Resolutor.query = function query(program, query, builtInActions) {
  if (query instanceof Clause) {
    let bodyLiterals = query.getBodyLiterals();
    let theta = {};
    for (let i in bodyLiterals) {
      let literal = bodyLiterals[i];
      let result = Resolutor.query(program, literal);
      if (result === null) {
        return null;
      }
      theta = Resolutor.compactTheta(theta, result);
    }
    return theta;
  }
  if (builtInActions && query instanceof Functor && builtInActions[query.getId()]) {
    builtInActions[query.getId()].apply(null, query.getArguments())
    return {};
  }
  for (let i in program) {
    let clause = program[i];
    if (clause.isFact()) { // we check the head literals for match
      let resolution = Resolutor.resolveAction(clause, query);
      if (resolution === null) {
        continue;
      }
      return resolution.theta;
    }

    let resolution = Resolutor.resolve(clause, query);
    if (resolution === null) {
      continue;
    }
    if (!resolution.clause.isFact()) {
      // the head is now our new query
      continue;
    }
    let result = Resolutor.query(program, new Clause([], resolution.clause.getHeadLiterals()))
    if (result === null) {
      continue;
    }
    let theta = Resolutor.compactTheta(resolution.theta, result);
    return theta;
  }
  return null;
};

Resolutor.resolve = function resolve(clause, fact) {
  let factVariableRenaming = variableArrayRename(fact.getVariables(), '$fv_*');
  let substitutedFact = fact
    .substitute(factVariableRenaming);
  let theta = {};
  let unresolvedBodyLiterals = [];
  let _head = clause.getHeadLiterals();
  let _body = clause.getBodyLiterals();

  _body.forEach((literal) => {
    let newTheta = Unifier.unifies([[substitutedFact, literal]], theta);
    if (newTheta === null) {
      // unable to unify, let's just add to unresolvedBodyLiterals
      unresolvedBodyLiterals.push(literal);
    } else {
      theta = newTheta;
    }
  });

  if (unresolvedBodyLiterals.length === _body.length) {
    // nothing got resolved, probably not a matching rule.
    return null;
  }

  // perform substitution here
  unresolvedBodyLiterals = unresolvedBodyLiterals.map((literal) => {
    return literal.substitute(theta);
  });

  // perform head check
  for (let i = 0; i < unresolvedBodyLiterals.length; i += 1) {
    let literal = unresolvedBodyLiterals[i];
    if ((literal instanceof BooleanBinaryOperator
          || literal instanceof BooleanUnaryOperator)
        && literal.isGround() && !literal.evaluate()) {
      // nope this doesn't work out
      return null;
    }
  }

  let newHead = _head.map(expressions => expressions.substitute(theta));
  theta = Resolutor.compactTheta(factVariableRenaming, theta);
  return {
    clause: new Clause(newHead, unresolvedBodyLiterals),
    theta: theta
  };
};

Resolutor.resolveAction = function resolveAction(clause, action) {
  let actionVariableRenaming = variableArrayRename(action.getVariables(), '$fv_*');
  let substitutedAction = action
    .substitute(actionVariableRenaming);
  let theta = {};
  let unresolvedHeadLiterals = [];
  let _head = clause.getHeadLiterals();
  let _body = clause.getBodyLiterals();

  _head.forEach((literal) => {
    let newTheta = Unifier.unifies([[substitutedAction, literal]], theta);
    if (newTheta === null) {
      // unable to unify, let's just add to unresolvedBodyLiterals
      unresolvedHeadLiterals.push(literal);
    } else {
      theta = newTheta;
    }
  });

  if (unresolvedHeadLiterals.length === _head.length) {
    // nothing got resolved, probably not a matching rule.
    return null;
  }

  // perform substitution here
  unresolvedHeadLiterals = unresolvedHeadLiterals.map((literal) => {
    return literal.substitute(theta);
  });

  // perform head check
  for (let i = 0; i < unresolvedHeadLiterals.length; i += 1) {
    let literal = unresolvedBodyLiterals[i];
    if ((literal instanceof BooleanBinaryOperator
          || literal instanceof BooleanUnaryOperator)
        && literal.isGround() && !literal.evaluate()) {
      // nope this doesn't work out
      return null;
    }
  }

  let newBody = _body.map(expressions => expressions.substitute(theta));
  theta = Resolutor.compactTheta(actionVariableRenaming, theta);
  return {
    clause: new Clause(unresolvedHeadLiterals, newBody),
    theta: theta
  };
};

module.exports = Resolutor;
