const LiteralTreeMap = require('./LiteralTreeMap');
const Resolutor = require('./Resolutor');
const Value = require('./Value');
const Variable = require('./Variable');

let fetchActionTiming = function fetchActionTiming(literal) {
  let arguments = literal.getArguments();
  if (arguments.length < 2) {
    throw new Error('Invalid action / event');
  }

  let t1TimingArg = arguments[arguments.length - 2];
  let t2TimingArg = arguments[arguments.length - 1];
  return [t1TimingArg, t2TimingArg];
}

let reduceCompositeEvent = function reduceCompositeEvent(eventAtom, program) {
  let reductions = [];
  let assumption = new LiteralTreeMap();
  assumption.add(eventAtom);

  program.forEach((clause) => {
    if (clause.isConstraint()) {
      return;
    }
    // assuming horn clauses only
    let headLiterals = clause.getHeadLiterals();
    let headLiteral = headLiterals[0];
    let headArgs = headLiteral.getArguments();
    let unifications = assumption.unifies(headLiteral);
    if (unifications.length === 0) {
      return;
    }
    let timingVar1Name = headArgs[headArgs.length - 2].evaluate();
    let timingVar2Name = headArgs[headArgs.length - 1].evaluate();
    unifications.forEach((pair) => {
      if (pair.theta[timingVar1Name] instanceof Variable) {
        delete pair.theta[timingVar1Name];
      }

      if (pair.theta[timingVar2Name] instanceof Variable) {
        delete pair.theta[timingVar2Name];
      }

      reductions.push(clause.getBodyLiterals().map(l => l.substitute(pair.theta)));
    });
  });


  return reductions;
};

let resolveStateConditions = function resolveStateConditions(clause, facts, resolved) {
  let thetaSet = [{ theta: {}, unresolved: [] }];
  clause.forEach((literal) => {
    let newThetaSet = [];
    thetaSet.forEach((tuple) => {
      let substitutedLiteral = literal.substitute(tuple.theta);
      if (resolved.contains(substitutedLiteral)) {
        return;
      }
      let literalThetas = Resolutor.findUnifications(substitutedLiteral, facts);
      if (literalThetas.length === 0) {
        newThetaSet.push({
          theta: tuple.theta,
          unresolved: tuple.unresolved.concat([substitutedLiteral])
        });
        return;
      }
      resolved.add(substitutedLiteral);
      literalThetas.forEach((t) => {
        let compactedTheta = Resolutor.compactTheta(tuple.theta, t.theta);
        newThetaSet.push({
          theta: compactedTheta,
          unresolved: tuple.unresolved.map(l => l.substitute(compactedTheta))
        });
      })
    });
    thetaSet = newThetaSet;
  });
  return thetaSet.map(t => t.unresolved).filter(a => a.length < clause.length);
}

let resolveSimpleActions = function resolveSimpleActions (clause, possibleActions, candidateActions) {
  let thetaSet = [{ theta: {}, unresolved: [], candidates: [] }];
  clause.forEach((literal) => {
    let newThetaSet = [];
    thetaSet.forEach((tuple) => {
      let substitutedLiteral = literal.substitute(tuple.theta);
      let literalThetas = possibleActions.unifies(substitutedLiteral);
      if (literalThetas.length === 0) {
        newThetaSet.push({
          theta: tuple.theta,
          unresolved: tuple.unresolved.concat([substitutedLiteral]),
          candidates: tuple.candidates
        });
        return;
      }
      literalThetas.forEach((t) => {
        let compactedTheta = Resolutor.compactTheta(tuple.theta, t.theta);
        substitutedLiteral = substitutedLiteral.substitute(compactedTheta);
        if (!substitutedLiteral.isGround()) {
          return;
        }
        newThetaSet.push({
          theta: compactedTheta,
          unresolved: tuple.unresolved,
          candidates: tuple.candidates.concat([substitutedLiteral])
        });
      })
    });
    thetaSet = newThetaSet;
  });

  thetaSet.forEach((tuple) => {
    tuple.candidates.forEach((literal) => {
      candidateActions.add(literal);
    });
  });
};

function GoalNode(clause) {
  this.clause = clause;
  this.children = [];
  this.resolvedLiterals = new LiteralTreeMap();

  this.getCandidateActionSet = function getCandidateActionSet(possibleActions) {
    let result = [];
    let candidateActions = new LiteralTreeMap();
    resolveSimpleActions(this.clause, possibleActions, candidateActions);
    if (this.children.length === 0) {
      return [candidateActions];
    }
    for (let i = 0; i < this.children.length; i += 1) {
      let childCandidateActionSet = this.children[i].getCandidateActionSet(possibleActions);
      if (childCandidateActionSet.length > 0) {
        result = result.concat(childCandidateActionSet);
      }
    }
    return result;
  };

  this.evaluate = function evaluate(program, facts) {
    if (this.clause.length === 0) {
      return true;
    }

    for (let i = 0; i < this.children.length; i += 1) {
      let result = this.children[i].evaluate(program, facts);
      if (result) {
        return true;
      }
    }

    let reductionResult = [];
    if (this.children.length === 0) {
      for (let i = 0; i < this.clause.length; i += 1) {
        reductionResult = reductionResult.concat(reduceCompositeEvent(clause[i], program));
      }
    }
    reductionResult = reductionResult.concat(resolveStateConditions(clause, facts, this.resolvedLiterals));

    let newChildren = [];
    reductionResult.forEach((r) => {
      newChildren.push(new GoalNode(r));
    });

    for (let i = 0; i < newChildren.length; i += 1) {
      let result = newChildren[i].evaluate(program, facts);
      if (result) {
        return true;
      }
    }
    this.children = this.children.concat(newChildren);
    return false;
  }
}

function GoalTree(goalClause) {
  let _root = new GoalNode(goalClause);

  this.evaluate = function evaluate(program, possibleActions, candidateActions, facts) {
    return _root.evaluate(program, possibleActions, candidateActions, facts);
  };

  this.getCandidateActionSet = function getCandidateActionSet(possibleActions) {
    return _root.getCandidateActionSet(possibleActions);
  }
}

module.exports = GoalTree;
