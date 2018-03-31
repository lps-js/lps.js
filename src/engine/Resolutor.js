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

Resolutor.query = function query(program, clause, query, builtInActions) {
  // if (query instanceof Clause) {
  //   let bodyLiterals = query.getBodyLiterals();
  //   let theta = {};
  //   for (let i in bodyLiterals) {
  //     let literal = bodyLiterals[i];
  //     let result = Resolutor.query(program, clause, literal, builtInActions);
  //     if (result === null) {
  //       return null;
  //     }
  //     console.log(result);
  //     theta = Resolutor.compactTheta(theta, result.theta);
  //   }
  //   return {
  //     theta: theta,
  //     clause: null
  //   };
  // }

  if (clause === null) {
    let result = [];
    for (let i in program) {
      let programClause = program[i];
      let queryResult = Resolutor.query(program, programClause, query, builtInActions);
      if (queryResult === null) {
        continue;
      }
      if (result instanceof Array) {
        result = result.concat(queryResult);
      } else {
        result.push(queryResult);
      }
    }
    return result;
  }

  if (builtInActions && query instanceof Functor && builtInActions[query.getId()]) {
    builtInActions[query.getId()].apply(null, query.getArguments());
    // TODO: return copy of query in clause
    return {
      theta: {},
      clause: query
    };
  }

  if (clause.isFact()) { // we check the head literals for match
    let resolution = Resolutor.resolveAction(clause, query);
    if (resolution === null) {
      return null;
    }
    return resolution;
  }

  let resolution = Resolutor.resolve(clause, query);
  if (resolution === null) {
    return null;
  }
  if (!resolution.clause.isFact()) {
    return null;
  }
  let headLiteral = resolution.clause.getHeadLiterals()[0];
  let queryResult = Resolutor.query(program, null, headLiteral, builtInActions);
  if (queryResult !== null) {
    queryResult = queryResult.map((result) => {
      result.theta = Resolutor.compactTheta(resolution.theta, result.theta);
      return result;
    });
  }
  return queryResult;
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
