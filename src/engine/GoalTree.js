const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Resolutor = lpsRequire('engine/Resolutor');
const Functor = lpsRequire('engine/Functor');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');
const variableArrayRename = lpsRequire('utility/variableArrayRename');
const compactTheta = lpsRequire('utility/compactTheta');
const hasExpiredTimable = lpsRequire('utility/hasExpiredTimable');
const ConjunctionMap = lpsRequire('engine/ConjunctionMap');
const TimableHelper = lpsRequire('utility/TimableHelper');
const dedupeConjunction = lpsRequire('utility/dedupeConjunction');

const reduceCompositeEvent = function reduceCompositeEvent(eventAtom, clauses, usedVariables) {
  let reductions = [];
  let assumption = new LiteralTreeMap();
  assumption.add(eventAtom);
  let renameTheta = variableArrayRename(usedVariables);
  let hasNewRenames = false;
  let processRenameTheta = (varName) => {
    let newVarName = renameTheta[varName].evaluate();
    if (renameTheta[newVarName] !== undefined) {
      renameTheta[varName] = renameTheta[newVarName];
      hasNewRenames = true;
    }
  };
  do {
    hasNewRenames = false;
    Object.keys(renameTheta).forEach(processRenameTheta);
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
        clause: clause.getBodyLiterals()
          .map(l => l.substitute(renameTheta).substitute(theta)),
        theta: outputTheta
      });
    });
  });

  return reductions;
};

let resolveStateConditions = function resolveStateConditions(program, clause) {
  let nodes = [];
  let processClause = function processClause(
    unresolvedClause,
    clauseSoFar,
    thetaSoFar,
    variablesSeenSoFar
  ) {
    if (unresolvedClause.length === 0) {
      if (clauseSoFar.length >= clause.length) {
        return true;
      }

      nodes.push({
        clause: clauseSoFar,
        theta: thetaSoFar
      });
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
        return processClause(
          [],
          clauseSoFar.concat(unresolvedClause),
          thetaSoFar,
          variablesSeenSoFar
        );
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

      return processClause(
        remainingUnresolvedClause,
        clauseSoFar.concat([conjunct]),
        thetaSoFar,
        newVariablesSeenSoFar
      );
    }

    let numFailures = 0;
    literalThetas.forEach((tupleArg) => {
      let tuple = tupleArg;
      let newTheta = {};
      conjunctVariables.forEach((varName) => {
        if (tuple.theta[varName] !== undefined) {
          newTheta[varName] = tuple.theta[varName];
        }
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

      let remainingClause = substitutedClauseSoFar.concat(substitutedRemainingUnresolvedClause);
      let subResult = processClause([], remainingClause, newThetaSoFar, newVariablesSeenSoFar);
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

const resolveSimpleActions = function resolveSimpleActions(
  clause,
  possibleActions,
  functorProvider,
  candidateActionSets,
  unresolvedSets
) {
  let thetaSet = [{ theta: {}, unresolved: [], candidates: [] }];
  let hasUnresolvedClause = false;

  clause.forEach((literal) => {
    if (hasUnresolvedClause) {
      thetaSet = thetaSet.map((tupleArg) => {
        let tuple = tupleArg;
        tuple.unresolved.push(literal);
        return tuple;
      });
      return;
    }
    let newThetaSet = [];
    thetaSet.forEach((tuple) => {
      let substitutedLiteral = literal.substitute(tuple.theta);
      let substitutedInstances = Resolutor
        .handleBuiltInFunctorArgumentInLiteral(functorProvider, substitutedLiteral);
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

const checkClauseExpiry = (program, conjunction, forTime) => {
  for (let i = 0; i < conjunction.length; i += 1) {
    let conjunct = conjunction[i];
    let conjunctArgs = conjunct.getArguments();
    if (program.isFluent(conjunct)) {
      let lastArg = conjunctArgs[conjunctArgs.length - 1];
      if (lastArg instanceof Value && lastArg.evaluate() < forTime) {
        return false;
      }
    } else if (program.isAction(conjunct) || program.isEvent(conjunct)) {
      let startTimeArg = conjunctArgs[conjunctArgs.length - 2];
      let endTimeArg = conjunctArgs[conjunctArgs.length - 1];

      if (startTimeArg instanceof Value && startTimeArg.evaluate() < forTime) {
        return false;
      }
      if (endTimeArg instanceof Value && endTimeArg.evaluate() < forTime + 1) {
        return false;
      }

      if (startTimeArg instanceof Value && endTimeArg instanceof Value
          && startTimeArg.evaluate() > endTimeArg.evaluate()) {
        return false;
      }
    }
  }
  return true;
};

function GoalNode(program, clauseArg, theta) {
  // deduplicate terms in the conjunction
  this.clause = dedupeConjunction(clauseArg);

  this.theta = theta;
  this.children = [];
  this.hasBranchFailed = false;
  let programClauses = program.getClauses();

  this.getEarliestDeadline = function getEarliestDeadline(currentTime) {
    let earliestDeadline = null;
    if (this.hasBranchFailed) {
      return null;
    }
    if (this.clause.length === 0) {
      return -1;
    }
    let checkAndUpdateDeadline = (timing) => {
      if (earliestDeadline === null
          || (currentTime <= timing && timing < earliestDeadline)) {
        earliestDeadline = timing;
      }
    };
    if (this.children.length === 0) {
      this.clause.forEach((conjunct) => {
        if (!program.isTimable(conjunct) || program.isTimableUntimed(conjunct)) {
          // we ignore this conjunct if it's not a timable or
          // it has no ground timing
          return;
        }
        let timing;
        let conjunctArgs = conjunct.getArguments();

        if (program.isFluent(conjunct)) {
          // only one timing variable
          timing = conjunctArgs[conjunctArgs.length - 1].evaluate();
          checkAndUpdateDeadline(timing);
          return;
        }

        // two timing variable, take start time
        timing = conjunctArgs[conjunctArgs.length - 2].evaluate();
        checkAndUpdateDeadline(timing);
      });
      return earliestDeadline;
    }
    let isFirstConjunctUntimed = program.isTimableUntimed(this.clause[0]);
    if (isFirstConjunctUntimed) {
      return null;
    }
    this.children.forEach((childNode) => {
      let deadline = childNode.getEarliestDeadline(currentTime);
      if (deadline === null) {
        return;
      }
      checkAndUpdateDeadline(deadline);
    });
    return earliestDeadline;
  };

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

  this.evaluate = function evaluate(
    forTime,
    possibleActions,
    leafNodes,
    evaluationQueue,
    processedNodes
  ) {
    let cachedValue = processedNodes.get(this.clause);
    if (cachedValue !== undefined) {
      if (cachedValue === null) {
        this.hasBranchFailed = true;
      }
      return cachedValue;
    }

    if (!checkClauseExpiry(program, this.clause, forTime)) {
      processedNodes.add(this.clause, null);
      return null;
    }

    if (this.clause.length === 0) {
      return [[this.theta]];
    }

    // only attempt to resolve the first literal left to right
    let reductionResult = [];
    let conjunct = this.clause[0];

    let usedVariables = {};
    for (let i = 0; i < this.clause.length; i += 1) {
      this.clause[i].getVariables().forEach((v) => {
        usedVariables[v] = true;
      });
    }
    usedVariables = Object.keys(usedVariables);
    let laterTimingVariables = {};
    for (let i = 0; i < this.clause.length; i += 1) {
      let literal = this.clause[i];
      if (program.isFluent(literal)) {
        // there's a fluent occurring before the composite
        // we don't process the composite until fluent has been resolved
        break;
      }
      if (program.isAction(literal)) {
        let startTimeArg = TimableHelper.getActionStartTime(literal);
        if (startTimeArg instanceof Variable) {
          if (laterTimingVariables[startTimeArg.evaluate()] !== undefined) {
            break;
          }
        }
        let endTimeArg = TimableHelper.getActionEndTime(literal);
        if (endTimeArg instanceof Variable) {
          laterTimingVariables[endTimeArg.evaluate()] = true;
        }
        continue;
      }

      let otherLiteralsFront = this.clause.slice(0, i);
      let otherLiteralsBack = this.clause.slice(i + 1, this.clause.length);
      let compositeReductionResult = reduceCompositeEvent(
        literal,
        programClauses,
        usedVariables
      );
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
        reductionResult.push(new GoalNode(program, newClause, crrArg.theta));
      });
      break;
    }

    let hasUntimedConjunctInClause = false;
    for (let i = 0; i < this.clause.length; i += 1) {
      if (program.isFluent(this.clause[i]) && program.isTimableUntimed(this.clause[i])) {
        hasUntimedConjunctInClause = true;
        break;
      }
    }

    let isFirstConjunctUntimed = program.isTimableUntimed(conjunct);

    let stateConditionResolutionResult = resolveStateConditions(program, this.clause);
    if (stateConditionResolutionResult === null && !hasUntimedConjunctInClause) {
      this.hasBranchFailed = true;
      processedNodes.add(this.clause, null);
      return null;
    }
    if (stateConditionResolutionResult !== null) {
      stateConditionResolutionResult.forEach((tuple) => {
        reductionResult.push(new GoalNode(program, tuple.clause, tuple.theta));
      });
    }

    // check for expired conjuncts
    reductionResult = reductionResult.filter((n) => {
      return checkClauseExpiry(program, n.clause, forTime);
    });

    let functorProvider = program.getFunctorProvider();

    let newChildren = [];
    reductionResult.forEach((r) => {
      let clause = r.clause;
      let nodes = [];
      let recursiveFunctorArgumentProcessing = (clause, l) => {
        if (l >= clause.length) {
          nodes.push(new GoalNode(program, clause, r.theta));
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
        });
        if (hasArgumentFunctor && isAllArgumentFunctorGround) {
          let instances = Resolutor
            .handleBuiltInFunctorArgumentInLiteral(functorProvider, conjunct);
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
    this.children = this.children.concat(newChildren);

    let numFailed = 0;
    for (let i = 0; i < newChildren.length; i += 1) {
      let result = newChildren[i].evaluate(
        forTime,
        possibleActions,
        leafNodes,
        evaluationQueue,
        processedNodes
      );
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
      processedNodes.add(this.clause, nodeResult);
      return nodeResult;
    }
    // this.children = this.children.concat(newChildren);

    if (!isFirstConjunctUntimed && newChildren.length > 0 && numFailed === newChildren.length) {
      processedNodes.add(this.clause, null);
      this.hasBranchFailed = true;
      return null;
    }

    if (newChildren.length === 0) {
      leafNodes.push(this);
    }

    if (newChildren.length === 0 || isFirstConjunctUntimed) {
      evaluationQueue.push(this);
    } else {
      processedNodes.add(this.clause, []);
    }

    return [];
  };
}

function GoalTree(program, goalClause) {
  let _root;
  if (goalClause instanceof GoalNode) {
    _root = goalClause;
  } else {
    _root = new GoalNode(program, goalClause, {});
  }

  let _leafNodes = [_root];
  let _evaluateQueue = [_root];

  this.getEarliestDeadline = function getEarliestDeadline(currentTime) {
    return _root.getEarliestDeadline(currentTime);
  };

  this.getRootClause = function () {
    return _root.clause.map(l => '' + l);
  };

  this.evaluate = function evaluate(forTime, possibleActions) {
    return new Promise((resolve) => {
      setTimeout(() => {
        _leafNodes = [];
        let newEvaluateQueue = [];
        let result = [];
        let processedNodes = new ConjunctionMap();

        for (let i = 0; i < _evaluateQueue.length; i += 1) {
          let node = _evaluateQueue[i];
          let nodeResult = node.evaluate(
            forTime,
            possibleActions,
            _leafNodes,
            newEvaluateQueue,
            processedNodes
          );
          if (nodeResult !== null && nodeResult.length !== 0) {
            result = nodeResult;
            break;
          }
        }

        _evaluateQueue = newEvaluateQueue;
        resolve(result);
      }, 0);
    });
  };

  this.forEachCandidateActions = function forEachCandidateActions(
    possibleActions,
    currentTime,
    callback
  ) {
    let functorProvider = program.getFunctorProvider();

    _leafNodes.forEach((node) => {
      let candidateActionSets = [];
      let unresolvedSets = [];
      let numCandidateActionsAdded = resolveSimpleActions(
        node.clause,
        possibleActions,
        functorProvider,
        candidateActionSets,
        unresolvedSets
      );

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
        clause: '' + node.clause,
        children: children
      };
    };

    return JSON.stringify(processNode(_root));
  };
}

module.exports = GoalTree;
