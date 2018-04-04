const Clause = require('./Clause');
const Functor = require('./Functor');
const Unifier = require('./Unifier');
const Variable = require('./Variable');
const variableArrayRename = require('../utility/variableArrayRename');

function Resolutor() {

}

let recursiveQueryRequest = function recursiveQueryRequest(program, queryArg, recursiveQuery) {
  const BuiltInFunctorProvider = require('./BuiltInFunctorProvider');
  let builtInFunctors = new BuiltInFunctorProvider(program);
  if (builtInFunctors.has(queryArg.getId())) {
    let result = builtInFunctors.execute(queryArg.getId(), queryArg.getArguments());
    if (result) {
      return [];
    }
    return null;
  }

  let programWithoutClause = [];
  for (let i = 0; i < program.length; i += 1) {
    let clause = program[i];
    programWithoutClause.push(program.filter(c => c !== clause));
  }
  let result = [];
  for (let i = 0; i < program.length; i += 1) {
    let clause = program[i];
    let queryResult = recursiveQuery(programWithoutClause[i], clause, queryArg);
    if (queryResult === null && clause.isConstraint()) {
      return null;
    }
    if (queryResult !== null) {
      result = result.concat(queryResult);
    }
  }
  return result;
};

let createRecursiveQuery = function createRecursiveQuery(program, actions) {
  // console.log('--');
  // program.forEach((c) => console.log(c.toString()));
  // console.log('--');
  return (programWithoutClause, clause, queryArg) => {
    if (actions.indexOf(queryArg.getId()) > -1) {
      return [{
        theta: {},
        actions: [
          {
            action: queryArg.getName(),
            arguments: queryArg.getArguments()
          }
        ]
      }];
    }

    if (clause.isFact()) { // we check the head literals for match
      let resolution = Resolutor.resolveAction(clause, queryArg);
      if (resolution === null) {
        return [];
      }
      return [{ theta: resolution.theta, actions: [] }];
    }

    let resolution = Resolutor.resolve(clause, queryArg);
    if (resolution === null) {
      return [];
    }

    if (clause.isConstraint()) {
      let bodyLiterals = resolution.clause.getBodyLiterals();
      let constraintQueryResult = Resolutor.query(programWithoutClause, bodyLiterals, actions);
      if (constraintQueryResult === null) {
        return [];
      }
      return null;
    }

    if (!resolution.clause.isFact()) {
      let bodyLiterals = resolution.clause.getBodyLiterals();
      // we need a program without the current clause otherwise we'll
      // end up in an infinite loop.

      if (Resolutor.query(programWithoutClause, bodyLiterals, actions) === null) {
        return null;
      }
    }

    let headLiteralSet = resolution.clause.getHeadLiterals();
    let headLiteral = headLiteralSet[0];

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

    let queryResult = Resolutor.query(program, headLiteral, actions);
    if (queryResult === null || queryResult.length === 0) {
      // possible but not proven yet
      return [];
    }
    queryResult = queryResult.map((resultArg) => {
      let result = resultArg;
      result.theta = Resolutor.compactTheta(resolution.theta, result.theta);
      return result;
    });
    return queryResult;
  };
};


let createRecursiveReverseQuery = function createRecursiveReverseQuery(program, actions) {
  return (programWithoutClause, clause, queryArg) => {
  };
};

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
    theta[key] = substitution;
  });
  return theta;
};

Resolutor.query = function query(program, queryLiteralSet, actionsArg) {
  let actions = actionsArg;
  if (actions === undefined) {
    actions = [];
  }

  if (queryLiteralSet instanceof Array) {
    // console.log('SET: ');
    //queryLiteralSet.forEach(c => console.log('' + c))
    let result = [];
    for (let i = 0; i < queryLiteralSet.length; i += 1) {
      let literal = queryLiteralSet[i];
      let queryResult = Resolutor.query(program, literal, actions);
      // console.log(literal + ' ');
      // console.log(queryResult);
      if (queryResult === null) {
        // console.log('---')
        // program.forEach(c => console.log('' + c))
        // console.log(literal + ' nope');
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
        });
      });
      result = newResult;
    }
    return result;
  }

  return recursiveQueryRequest(program, queryLiteralSet, createRecursiveQuery(program, actions));
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
    for (let i = 0; i < program.length; i += 1) {
      let programClause = program[i];
      let queryResult = Resolutor.reverseQuery(program, programClause, head, actions);
      if (queryResult !== null) {
        result = result.concat(queryResult);
      }
    }
    return result;
  }

  if (clause.isFact() || clause.isConstraint()) {
    // not interested in facts or queries
    return null;
  }

  let resolution = Resolutor.resolveAction(clause, head);
  if (resolution === null) {
    return null;
  }
  if (resolution.clause.getHeadLiteralsCount() > 0) {
    return null;
  }

  let bodyLiterals = resolution.clause.getBodyLiterals();

  // we need a program without the current clause otherwise we'll
  // end up in an infinite loop.
  let programP = program.filter(c => c !== clause);
  let result = [];
  for (let i = 0; i < bodyLiterals.length; i += 1) {
    let queryHead = bodyLiterals[i];
    let queryResult = Resolutor.reverseQuery(programP, null, queryHead, actions);
    if (queryResult === null) {
      return null;
    }
    queryResult = queryResult.map((rArg) => {
      let r = rArg;
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
    if (literal.isGround() && !literal.evaluate()) {
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
    let literal = unresolvedHeadLiterals[i];
    if (literal.isGround() && !literal.evaluate()) {
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
