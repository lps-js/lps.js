const LiteralTreeMap = require('./LiteralTreeMap');
const BuiltInFunctorProvider = require('./BuiltInFunctorProvider');
const Resolutor = require('./Resolutor');
const Value = require('./Value');
const Variable = require('./Variable');

let fetchActionTiming = function fetchActionTiming(literal) {
  let args = literal.getArguments();
  if (args.length < 2) {
    throw new Error('Invalid action / event');
  }

  let t1TimingArg = args[args.length - 2];
  let t2TimingArg = args[args.length - 1];
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
  let builtInFunctorProvider = new BuiltInFunctorProvider((literal) => {
    return Resolutor.findUnifications(literal, facts);
  })
  let thetaSet = [{ theta: {}, unresolved: [] }];
  clause.forEach((literal) => {
    if (thetaSet === null) {
      return;
    }
    let newThetaSet = [];
    thetaSet.forEach((tuple) => {
      let substitutedLiteral = literal.substitute(tuple.theta);
      if (resolved.contains(substitutedLiteral)) {
        return;
      }
      let literalThetas = [];
      if (substitutedLiteral.isGround() && builtInFunctorProvider.has(substitutedLiteral.getId())) {
        literalThetas = builtInFunctorProvider.execute(substitutedLiteral);
        if (literalThetas.length === 0) {
          newThetaSet = null;
          return;
        }
      } else {
        literalThetas = Resolutor.findUnifications(substitutedLiteral, facts);
      }
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
  if (thetaSet === null) {
    return null;
  }
  return thetaSet.map(t => t.unresolved).filter(a => a.length < clause.length);
};

let resolveSimpleActions = function resolveSimpleActions (clause, possibleActions, candidateActions) {
  let thetaSet = [{ theta: {}, unresolved: [], candidates: [] }];
  let hasUnresolvedClause = false;
  clause.forEach((literal) => {
    if (hasUnresolvedClause) {
      return;
    }
    let newThetaSet = [];
    thetaSet.forEach((tuple) => {
      let substitutedLiteral = literal.substitute(tuple.theta);
      let literalThetas = possibleActions.unifies(substitutedLiteral);
      if (literalThetas.length === 0) {
        if (!substitutedLiteral.isGround()) {
          hasUnresolvedClause = true;
        }
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
    if (this.children.length === 0) {
    let candidateActions = new LiteralTreeMap();
      resolveSimpleActions(this.clause, possibleActions, candidateActions);
      return [candidateActions];
    }

    let result = [];
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

    let reductionResult = [];
    let stateConditionResolutionResult = resolveStateConditions(clause, facts, this.resolvedLiterals);
    if (stateConditionResolutionResult === null) {
      // node failed indefinitely
      return false;
    }
    reductionResult = reductionResult.concat(stateConditionResolutionResult);
    if (this.children.length === 0) {
      for (let i = 0; i < this.clause.length; i += 1) {
        let compositeReductionResult = reduceCompositeEvent(clause[i], program);
        compositeReductionResult.forEach((crrArg) => {
          // crr needs to rename variables to avoid clashes
          let varToChange = [];
          this.clause.forEach((l) => {
            varToChange = varToChange.concat(l.getVariables());
          });
          let theta = Resolutor.compactTheta(variableArrayRename(varToChange), crrArg.theta);
          let crr = crrArg.clause.map((l) => {
            return l.substitute(theta);
          });
          let remappedClause = this.clause.map((l) => {
            return l.substitute(theta);
          })
          let newClause = remappedClause.slice(0, i).concat(crr).concat(remappedClause.slice(i + 1, this.clause.length));
          reductionResult.push(newClause);
        });
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

  this.evaluate = function evaluate(program, facts) {
    return _root.evaluate(program, facts);
  };

  this.getCandidateActionSet = function getCandidateActionSet(possibleActions) {
    return _root.getCandidateActionSet(possibleActions);
  }
}

module.exports = GoalTree;
