const LiteralTreeMap = require('./LiteralTreeMap');
const Resolutor = require('./Resolutor');
const Functor = require('./Functor');
const Variable = require('./Variable');
const Value = require('./Value');
const variableArrayRename = require('../utility/variableArrayRename');
const compactTheta = require('../utility/compactTheta');
const hasExpiredTimable = require('../utility/hasExpiredTimable');

let reduceCompositeEvent = function reduceCompositeEvent(eventAtom, clauses, usedVariables) {
  let reductions = [];
  let assumption = new LiteralTreeMap();
  assumption.add(eventAtom);
  let renameTheta = variableArrayRename(usedVariables);
  let hasNewRenames = false;
  do {
    hasNewRenames = false;
    Object.keys(renameTheta).forEach((varName) => {
      let newVarName = renameTheta[varName].evaluate();
      if (renameTheta[newVarName] !== undefined) {
        renameTheta[varName] = renameTheta[newVarName];
        hasNewRenames = true;
      }
    });
  } while (hasNewRenames);
  let outputVariables = eventAtom.getVariables();

  clauses.forEach((clause) => {
    if (clause.isConstraint()) {
      return;
    }
    // assuming horn clauses only
    let headLiterals = clause.getHeadLiterals();
    let headLiteral = headLiterals[0].substitute(renameTheta);
    let unifications = assumption.unifies(headLiteral);
    if (unifications.length === 0) {
      return;
    }

    unifications.forEach((pair) => {
      let theta = pair.theta;
      let outputTheta = {};
      outputVariables.forEach((varName) => {
        if (theta[varName] !== undefined) {
          outputTheta[varName] = theta[varName];
        }
      });

      reductions.push({
        clause: clause.getBodyLiterals().map(l => l.substitute(renameTheta).substitute(theta)),
        theta: outputTheta
      });
    });
  });

  return reductions;
};

let resolveStateConditions = function resolveStateConditions(program, clause, possibleActions, currentTime) {
  let functorProvider = program.getFunctorProvider();

  let nodes = [];
  let processClause = function processClause(unresolvedClause, clauseSoFar, thetaSoFar, variablesSeenSoFar) {
    if (unresolvedClause.length === 0) {
      if (clauseSoFar.length >= clause.length) {
        return true;
      }

      nodes.push(new GoalNode(clauseSoFar, thetaSoFar));
      return true;
    }
    let conjunct = unresolvedClause[0];
    let remainingUnresolvedClause = unresolvedClause.slice(1);

    let conjunctVariables = conjunct.getVariables();
    let isConjunctAction = program.isAction(conjunct);

    // variables check
    let canProceed = true;
    if (!isConjunctAction) {
      conjunctVariables.forEach((v) => {
        if (variablesSeenSoFar[v] !== undefined) {
          canProceed = false;
        }
      });

      // don't attempt to resolve conjuncts that has output variables from earlier conjuncts
      if (!canProceed) {
        return processClause([], clauseSoFar.concat(unresolvedClause), thetaSoFar, variablesSeenSoFar);
      }
    }
    let literalThetas = program.query(conjunct);

    if (literalThetas.length === 0) {
      // check for indefinite failure
      if (conjunct.isGround()) {
        return false;
      }

      let newVariablesSeenSoFar = {};

      conjunctVariables.forEach((varName) => {
        newVariablesSeenSoFar[varName] = true;
      });

      Object.keys(variablesSeenSoFar).forEach((v) => {
        newVariablesSeenSoFar[v] = variablesSeenSoFar[v];
      });

      return processClause(remainingUnresolvedClause, clauseSoFar.concat([conjunct]), thetaSoFar, newVariablesSeenSoFar);
    }

    let numFailures = 0;
    literalThetas.forEach((tupleArg) => {
      let tuple = tupleArg;
      let newTheta = {};
      conjunctVariables.forEach((varName) => {
        if (tuple.theta[varName] !== undefined) {
          newTheta[varName] = tuple.theta[varName];
        };
      });
      tuple.theta = newTheta;
      let newThetaSoFar = compactTheta(thetaSoFar, tuple.theta);
      let newVariablesSeenSoFar = {};

      conjunctVariables.forEach((varName) => {
        newVariablesSeenSoFar[varName] = true;
      });

      Object.keys(variablesSeenSoFar).forEach((v) => {
        newVariablesSeenSoFar[v] = variablesSeenSoFar[v];
      });

      Object.keys(newThetaSoFar).forEach((v) => {
        if (newThetaSoFar[v] instanceof Variable) {
          let newVarName = newThetaSoFar[v].evaluate();
          newVariablesSeenSoFar[newVarName] = true;
          delete newVariablesSeenSoFar[v];
        }
      });

      let substitutedClauseSoFar = clauseSoFar.map((c) => {
        return c.substitute(newThetaSoFar);
      });

      let substitutedRemainingUnresolvedClause = remainingUnresolvedClause.map((c) => {
        return c.substitute(newThetaSoFar);
      });

      let subResult = processClause([], substitutedClauseSoFar.concat(substitutedRemainingUnresolvedClause), newThetaSoFar, newVariablesSeenSoFar);
      if (!subResult) {
        numFailures += 1;
      }
    });
    return numFailures < literalThetas.length;
  };

  let hasSucceeded = processClause(clause, [], {}, {});

  if (!hasSucceeded) {
    return null;
  }
  return nodes;
};

let resolveSimpleActions = function resolveSimpleActions(clause, possibleActions, functorProvider, candidateActionSets, unresolvedSets) {
  let thetaSet = [{ theta: {}, unresolved: [], candidates: [] }];
  let hasUnresolvedClause = false;
  let seenVariables = {};
  clause.forEach((literal) => {
    if (hasUnresolvedClause) {
      return;
    }
    let newThetaSet = [];
    thetaSet.forEach((tuple) => {
      let substitutedLiteral = literal.substitute(tuple.theta);
      let substitutedInstances = Resolutor.handleBuiltInFunctorArgumentInLiteral(functorProvider, substitutedLiteral);
      substitutedInstances.forEach((instance) => {
        let literalThetas = possibleActions.unifies(instance);
        if (literalThetas.length === 0) {
          if (!instance.isGround()) {
            hasUnresolvedClause = true;
          }
          newThetaSet.push({
            theta: tuple.theta,
            unresolved: tuple.unresolved.concat([instance]),
            candidates: tuple.candidates
          });
          return;
        }
        literalThetas.forEach((t) => {
          let compactedTheta = compactTheta(tuple.theta, t.theta);
          let instanceResult = instance.substitute(compactedTheta);
          newThetaSet.push({
            theta: compactedTheta,
            unresolved: tuple.unresolved,
            candidates: tuple.candidates.concat([instanceResult])
          });
        });
      });
    });
    thetaSet = newThetaSet;
  });

  let numAdded = 0;
  thetaSet.forEach((tuple) => {
    let candidateActions = new LiteralTreeMap();
    tuple.candidates.forEach((literal) => {
      numAdded += 1;
      candidateActions.add(literal);
    });
    unresolvedSets.push(tuple.unresolved.map(c => c.substitute(tuple.theta)));
    candidateActionSets.push(candidateActions);
  });

  return numAdded;
};

function GoalNode(clause, theta) {
  this.clause = clause;
  this.theta = theta;
  this.children = [];
  this.hasBranchFailed = false;

  this.checkIfBranchFailed = function checkIfBranchFailed() {
    if (this.hasBranchFailed) {
      return true;
    }

    if (this.children.length === 0) {
      return false;
    }

    let numFailed = 0;
    for (let i = 0; i < this.children.length; i += 1) {
      if (this.children[i].checkIfBranchFailed()) {
        numFailed += 1;
      }
    }
    if (this.children.length > 0 && numFailed === this.children.length) {
      this.hasBranchFailed = true;
      return true;
    }
    return false;
  };

  this.evaluate = function evaluate(program, forTime, possibleActions, leafNodes, evaluationQueue, resolvedGoalClauses) {
    if (resolvedGoalClauses['' + this.clause] !== undefined) {
      if (resolvedGoalClauses['' + this.clause] === null) {
        this.hasBranchFailed = true;
      }
      return resolvedGoalClauses['' + this.clause];
    }

    if (this.hasBranchFailed) {
      resolvedGoalClauses['' + this.clause] = null;
      return null;
    }

    if (this.clause.length === 0) {
      return [[this.theta]];
    }

    // only attempt to resolve the first literal left to right
    let reductionResult = [];
    let processCompositeEvent = true;
    let conjunct = this.clause[0];

    if (reductionResult.length === 0) {
      let usedVariables = {};
      for (let i = 0; i < this.clause.length; i += 1) {
        this.clause[i].getVariables().forEach((v) => {
          usedVariables[v] = true;
        });
      }
      usedVariables = Object.keys(usedVariables);
      for (let i = 0; i < this.clause.length; i += 1) {
        let literal = this.clause[i];
        if (program.isFluent(literal) || (literal instanceof Functor && literal.getId() === '!/1' && program.isFluent(literal.getArguments()[0]))) {
          break;
        }
        if (program.isAction(literal)) {
          continue;
        }

        let otherLiteralsFront = this.clause.slice(0, i);
        let otherLiteralsBack = this.clause.slice(i + 1, this.clause.length);
        let compositeReductionResult = reduceCompositeEvent(literal, program.getClauses(), usedVariables);
        compositeReductionResult.forEach((crrArg) => {
          // crr needs to rename variables to avoid clashes
          // also at the same time handle any output variables
          let remappedClauseFront = otherLiteralsFront.map((l) => {
            return l
              .substitute(crrArg.theta);
          });
          let remappedClauseBack = otherLiteralsBack.map((l) => {
            return l
              .substitute(crrArg.theta);
          });
          let newClause = remappedClauseFront
            .concat(crrArg.clause)
            .concat(remappedClauseBack);
          reductionResult.push(new GoalNode(newClause, crrArg.theta));
        });
        break;
      }
    }

    let hasUntimedConjunctInClause = false;
    for (let i = 0; i < this.clause.length; i += 1) {
      if (program.isFluent(this.clause[i]) && program.isTimableUntimed(this.clause[i])) {
        hasUntimedConjunctInClause = true;
        break;
      }
    }

    let isFirstConjunctUntimed = program.isTimableUntimed(conjunct);
    if (reductionResult.length === 0) {
      let stateConditionResolutionResult = resolveStateConditions(program, clause, possibleActions, forTime);
      if (stateConditionResolutionResult === null && !hasUntimedConjunctInClause) {
        this.hasBranchFailed = true;
        resolvedGoalClauses['' + this.clause] = null;
        return null;
      }
      if (stateConditionResolutionResult !== null) {
        reductionResult = reductionResult.concat(stateConditionResolutionResult);
      }
    }

    if (reductionResult.length === 0) {
      // check for expired conjuncts
      for (let i = 0; i < this.clause.length; i += 1) {
        let literal = this.clause[i];
        let literalArgs = literal.getArguments();
        if (program.isFluent(literal)) {
          let lastArg = literalArgs[literalArgs.length - 1];
          if (lastArg instanceof Value && lastArg.evaluate() < forTime) {
            this.hasBranchFailed = true;
            resolvedGoalClauses['' + this.clause] = null;
            return null;
          }
        } else if (program.isAction(literal) || program.isEvent(literal)) {
          let startTimeArg = literalArgs[literalArgs.length - 2];
          let endTimeArg = literalArgs[literalArgs.length - 1];

          if (startTimeArg instanceof Value && startTimeArg.evaluate() < forTime) {
            this.hasBranchFailed = true;
            resolvedGoalClauses['' + this.clause] = null;
            return null;
          }
          if (endTimeArg instanceof Value && endTimeArg.evaluate() < forTime + 1) {
            this.hasBranchFailed = true;
            resolvedGoalClauses['' + this.clause] = null;
            return null;
          }
        }
      }
    }

    let functorProvider = program.getFunctorProvider();

    let newChildren = [];
    reductionResult.forEach((r) => {
      let clause = r.clause;
      let nodes = [];
      let recursiveFunctorArgumentProcessing = (clause, l) => {
        if (l >= clause.length) {
          nodes.push(new GoalNode(clause, r.theta));
          return;
        }
        let conjunct = clause[l];
        let isAllArgumentFunctorGround = true;
        let hasArgumentFunctor = false;
        clause[l].getArguments().forEach((literalArg) => {
          if (literalArg instanceof Functor && !literalArg.isGround()) {
            isAllArgumentFunctorGround = false;
          }
          if (literalArg instanceof Functor) {
            hasArgumentFunctor = true;
          }
        })
        if (hasArgumentFunctor && isAllArgumentFunctorGround) {
          let instances = Resolutor.handleBuiltInFunctorArgumentInLiteral(functorProvider, conjunct);
          instances.forEach((instance) => {
            let clauseCopy = clause.concat([]);
            clauseCopy[l] = instance;
            recursiveFunctorArgumentProcessing(clauseCopy, l + 1);
          });
        } else {
          recursiveFunctorArgumentProcessing(clause, l + 1);
        }
      };
      recursiveFunctorArgumentProcessing(r.clause, 0);
      nodes.forEach((n) => {
        newChildren.push(n);
      });
    });

    let numFailed = 0;
    for (let i = 0; i < newChildren.length; i += 1) {
      if (resolvedGoalClauses[''+newChildren[i].clause] !== undefined) {
        if (resolvedGoalClauses[''+newChildren[i].clause] === null) {
          numFailed += 1;
        }
        continue;
      }
      this.children.push(newChildren[i]);
      let result = newChildren[i].evaluate(program, forTime, possibleActions, leafNodes, evaluationQueue, resolvedGoalClauses);
      if (result === null || result.length === 0) {
        if (result === null) {
          numFailed += 1;
        }
        continue;
      }
      let nodeResult = [];
      result.forEach((subpath) => {
        nodeResult.push([this.theta].concat(subpath));
      });
      resolvedGoalClauses['' + this.clause] = nodeResult;
      return nodeResult;
    }
    // this.children = this.children.concat(newChildren);

    if (numFailed > 0 && numFailed === newChildren.length) {
      resolvedGoalClauses['' + this.clause] = null;
      this.hasBranchFailed = true;
      return null;
    }

    if (this.checkIfBranchFailed()) {
      resolvedGoalClauses['' + this.clause] = null;
      return null;
    }

    if (newChildren.length === 0 && this.children.length === 0) {
      leafNodes.push(this);
    }

    if (this.children.length === 0) {
      evaluationQueue.push(this);
    }

    resolvedGoalClauses['' + this.clause] = [];
    return [];
  };
}

function GoalTree(goalClause) {
  let _root = undefined;
  if (goalClause instanceof GoalNode) {
    _root = goalClause;
  } else {
    _root = new GoalNode(goalClause, {});
  }

  let _leafNodes = [_root];
  let _evaluateQueue = [_root];

  this.checkTreeFailed = function checkTreeFailed() {
    return _root.checkIfBranchFailed();
  };

  this.getRootClause = function () {
    return _root.clause.map(l => '' + l);
  };

  this.evaluate = function evaluate(program, forTime, possibleActions) {
    return new Promise((resolve) => {
      setTimeout(() => {
        _leafNodes = [];
        let newEvaluateQueue = [];
        let result = [];
        let resolvedGoalClauses = {};

        for (let i = 0; i < _evaluateQueue.length; i += 1) {
          let node = _evaluateQueue[i];
          let nodeResult = node.evaluate(program, forTime, possibleActions, _leafNodes, newEvaluateQueue, resolvedGoalClauses);
          if (nodeResult !== null && nodeResult.length !== 0) {
            result = nodeResult;
            break;
          }
        }

        _evaluateQueue = newEvaluateQueue;
        resolve(result);
      }, 0)
    });
  };

  this.forEachCandidateActions = function forEachCandidateActions(program, possibleActions, currentTime, callback) {
    let functorProvider = program.getFunctorProvider();
    _leafNodes.forEach((node) => {
      let candidateActionSets = [];
      let unresolvedSets = [];
      let numCandidateActionsAdded = resolveSimpleActions(
        node.clause,
        possibleActions,
        functorProvider,
        candidateActionSets,
        unresolvedSets);

      if (numCandidateActionsAdded === 0) {
        return;
      }

      for (let i = 0; i < candidateActionSets.length; i += 1) {
        let unresolved = unresolvedSets[i];
        if (hasExpiredTimable(unresolved, program, currentTime)) {
          continue;
        }
        let candidateActions = candidateActionSets[i];
        callback(candidateActions);
      }
    });
  };

  this.clone = function clone() {
    let cloneNode = function cloneNode(node) {
      let clonedNode = new GoalNode(node.clause, node.theta);
      node.children.forEach((childNode) => {
        let clonedChild = cloneNode(childNode);
        clonedNode.children.push(clonedChild);
      });
      return clonedNode;
    }
    let clonedRoot = cloneNode(_root);
    return new GoalTree(clonedRoot);
  };

  this.toJSON = function toJSON() {
    let processNode = function processNode(node) {
      let children = [];
      node.children.forEach((childNode) => {
        let c = processNode(childNode);
        children.push(c);
      });
      if (children.length === 0) {
        return {
          hasFailed: node.hasBranchFailed,
          clause: '' + node.clause
        };
      }
      return {
        hasFailed: node.hasBranchFailed,
        clause: ''+node.clause,
        children: children
      };
    };

    return JSON.stringify(processNode(_root));
  };
}

module.exports = GoalTree;
