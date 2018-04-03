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

Resolutor.query = function query(program, clause, query, actions) {
  if (query instanceof Array) {
    let result = [];
    for (let i in query) {
      let literal = query[i];
      let queryResult = Resolutor.query(program, clause, literal, actions);
      if (result === null) {
        return null;
      }

      if (result.length === 0) {
        result = result.concat(queryResult);
        continue;
      }

      let newResult = [];
      result.forEach((r) => {
        queryResult.forEach((q) => {
          let rtheta = r.theta;
          rtheta = Resolutor.compactTheta(r.theta, q.theta);
          newResult.push({
            theta: rtheta,
            actions: r.actions.concat(q.actions)
          });
        })
      })
      result = newResult;
    }
    return result;
  }

  if (clause === null) {
    let result = [];
    for (let i in program) {
      let programClause = program[i];
      let queryResult = Resolutor.query(program, programClause, query, actions);
      if (queryResult === null) {
        continue;
      }
      result = result.concat(queryResult);
    }
    return result;
  }

  if (actions !== undefined && query instanceof Functor && actions.indexOf(query.getId()) > -1) {
    return [{
      theta: {},
      actions: [
        {
          action: query.getName(),
          arguments: query.getArguments()
        }
      ]
    }];
  }

  if (clause.isFact()) { // we check the head literals for match
    let resolution = Resolutor.resolveAction(clause, query);
    if (resolution === null) {
      return null;
    }
    return [{ theta: resolution.theta, actions: [] }];
  }

  let resolution = Resolutor.resolve(clause, query);
  if (resolution === null) {
    return null;
  }
  if (!resolution.clause.isFact()) {
    let bodyLiterals = resolution.clause.getBodyLiterals();
    // we need a program without the current clause otherwise we'll
    // end up in an infinite loop.
    let programP = program.filter(c => c !== clause);
    if (Resolutor.query(programP, null, bodyLiterals, actions) === null) {
      return null;
    }
  }
  let headLiteral = resolution.clause.getHeadLiterals()[0];

  if (actions !== undefined && actions.indexOf(headLiteral.getId()) > -1) {
    return [{
      theta: resolution.theta,
      actions: [
        {
          action: headLiteral.getName(),
          arguments: headLiteral.getArguments()
        }
      ]
    }];
  }
  let queryResult = Resolutor.query(program, null, headLiteral, actions);
  if (queryResult === null || queryResult.length === 0) {
    // possible but not proven yet
    return null;
  }
  queryResult = queryResult.map((result) => {
    result.theta = Resolutor.compactTheta(resolution.theta, result.theta);
    return result;
  });
  return queryResult;
};

Resolutor.reverseQuery = function query(program, clause, head, actions) {
  if (actions !== undefined && actions.indexOf(head.getId()) > -1) {
    return [{
      theta: {},
      actions: [
        {
          action: head.getName(),
          arguments: head.getArguments()
        }
      ]
    }];
  }
  if (clause === null) {
    let result = [];
    for (let i in program) {
      let programClause = program[i];
      let queryResult = Resolutor.reverseQuery(program, programClause, head, actions);
      if (queryResult === null) {
        continue;
      }
      result = result.concat(queryResult);
    }
    return result;
  }

  if (clause.isFact()) {
    // not interested in facts.
    return null;
  }

  let resolution = Resolutor.resolveAction(clause, head);
  if (resolution === null) {
    return null;
  }
  if (resolution.clause.getHeadLiteralsCount() > 0) {
    console.log('test');
    return null;
  }

  let bodyLiterals = resolution.clause.getBodyLiterals();

  // we need a program without the current clause otherwise we'll
  // end up in an infinite loop.
  let programP = program.filter(c => c !== clause);
  let result = [];
  for (let i in bodyLiterals) {
    let queryHead = bodyLiterals[i];
    let queryResult = Resolutor.reverseQuery(programP, null, queryHead, actions);
    if (queryResult === null) {
      return null;
    }
    queryResult = queryResult.map((r) => {
      r.theta = Resolutor.compactTheta(resolution.theta, r.theta);
      return r;
    });
    result = result.concat(queryResult);
  }
  return result;
};

Resolutor.resolve = function resolve(clause, fact, thetaArg) {
  let factVariableRenaming = variableArrayRename(fact.getVariables(), '$fv_*');
  let substitutedFact = fact
    .substitute(factVariableRenaming);
  let theta = thetaArg;
  if (theta === undefined) {
    theta = {};
  }
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

Resolutor.resolveAction = function resolveAction(clause, action, thetaArg) {
  let actionVariableRenaming = variableArrayRename(action.getVariables(), '$fv_*');
  let substitutedAction = action
    .substitute(actionVariableRenaming);
  let theta = thetaArg;
  if (theta === undefined) {
    theta = {};
  }
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
