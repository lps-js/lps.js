/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Resolutor = lpsRequire('engine/Resolutor');
const Functor = lpsRequire('engine/Functor');
const Timable = lpsRequire('engine/Timable');
const Variable = lpsRequire('engine/Variable');
const variableArrayRename = lpsRequire('utility/variableArrayRename');
const compactTheta = lpsRequire('utility/compactTheta');
const ConjunctionMap = lpsRequire('engine/ConjunctionMap');
const dedupeConjunction = lpsRequire('utility/dedupeConjunction');
const sortTimables = lpsRequire('utility/sortTimables');
const resolveTimableThetaTiming = lpsRequire('utility/resolveTimableThetaTiming');
const hasExpiredTimable = lpsRequire('utility/hasExpiredTimable');

const reduceCompositeEvent = function reduceCompositeEvent(conjunct, program, usedVariables) {
  let reductions = [];

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

  program
    .getDefinitions(conjunct, renameTheta)
    .forEach((tuple) => {
      let theta = tuple.theta;
      let definition = tuple.definition;
      reductions.push({
        conjuncts: definition,
        theta: theta
      });
    });

  return reductions;
};

let resolveStateConditions = function resolveStateConditions(program, earlyConjuncts, forTime) {
  let nodes = [];

  let processConjuncts = function processConjuncts(
    remainingConjuncts,
    residueConjuncts,
    thetaSoFar
  ) {
    if (remainingConjuncts.length === 0) {
      if (residueConjuncts.length === earlyConjuncts.length) {
        // everything in the earlyConjuncts are actions
        return true;
      }

      let substitutedResidentConjuncts = residueConjuncts.map((c) => {
        return c.substitute(thetaSoFar);
      });

      nodes.push({
        conjuncts: substitutedResidentConjuncts,
        theta: thetaSoFar
      });
      return true;
    }

    let newTheta = {};
    Object.keys(thetaSoFar).forEach((v) => {
      newTheta[v] = thetaSoFar[v];
    });

    let conjunct = remainingConjuncts[0]
      .substitute(newTheta);
    let thetaDelta = resolveTimableThetaTiming(conjunct, newTheta, forTime);
    let goal = conjunct
      .getGoal()
      .substitute(thetaDelta);

    let otherConjuncts = remainingConjuncts.slice(1);

    let conjunctVariables = conjunct.getVariables();
    let isConjunctAction = program.isAction(goal);

    let literalThetas = program.query(goal);

    if (literalThetas.length === 0) {
      if (isConjunctAction) {
        return processConjuncts(
          otherConjuncts,
          residueConjuncts.concat([conjunct]),
          thetaSoFar
        );
      }
      return false;
    }

    let numFailures = 0;
    literalThetas.forEach((tupleArg) => {
      let tuple = tupleArg;
      let updatedTheta = {};
      conjunctVariables
        .forEach((varName) => {
          if (tuple.theta[varName] !== undefined) {
            updatedTheta[varName] = tuple.theta[varName];
          }
        });
      tuple.theta = updatedTheta;
      let newThetaSoFar = compactTheta(newTheta, tuple.theta);

      let subResult = processConjuncts(
        [],
        residueConjuncts.concat(otherConjuncts),
        newThetaSoFar
      );
      if (!subResult) {
        numFailures += 1;
      }
    });
    return numFailures < literalThetas.length;
  };

  let hasSucceeded = processConjuncts(earlyConjuncts, [], {}, {});

  if (!hasSucceeded) {
    return null;
  }
  return nodes;
};

const resolveSimpleActions = function resolveSimpleActions(
  earlyConjuncts,
  program,
  functorProvider,
  candidateActionSets,
  unresolvedSets
) {
  let thetaSet = [{ theta: {}, unresolved: [], candidates: [] }];
  let hasUnresolvedClause = false;

  for (let i = 0; i < earlyConjuncts.length; i += 1) {
    let conjunct = earlyConjuncts[i];
    let literal = conjunct.getGoal();
    if (!program.isAction(literal)) {
      return 0;
    }

    if (hasUnresolvedClause) {
      thetaSet = thetaSet.map((tupleArg) => {
        let tuple = tupleArg;
        tuple.unresolved.push(conjunct);
        return tuple;
      });
      continue;
    }

    let newThetaSet = [];
    thetaSet.forEach((tuple) => {
      let substitutedLiteral = literal.substitute(tuple.theta);
      let substitutedInstances = Resolutor
        .handleBuiltInFunctorArgumentInLiteral(functorProvider, substitutedLiteral);
      substitutedInstances.forEach((instance) => {
        newThetaSet.push({
          theta: tuple.theta,
          unresolved: tuple.unresolved,
          candidates: tuple.candidates.concat([instance])
        });
      });
    });
    thetaSet = newThetaSet;
  }

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

const processArgumentFunctorsInClause = function processArgumentFunctorsInClause(
  program,
  reductionResult
) {
  let functorProvider = program.getFunctorProvider();
  let newChildren = [];
  reductionResult.forEach((r) => {
    let nodes = [];
    let recursiveFunctorArgumentProcessing = (conjuncts, l) => {
      if (l >= conjuncts.length) {
        // base case, processed
        nodes.push([conjuncts, r[1]]);
        return;
      }
      let goal = conjuncts[l].getGoal();
      let isAllArgumentFunctorGround = true;
      let hasArgumentFunctor = false;
      goal.getArguments()
        .forEach((literalArg) => {
          if (literalArg instanceof Functor && !literalArg.isGround()) {
            isAllArgumentFunctorGround = false;
          }
          if (literalArg instanceof Functor) {
            hasArgumentFunctor = true;
          }
        });
      if (hasArgumentFunctor && isAllArgumentFunctorGround) {
        let instances = Resolutor
          .handleBuiltInFunctorArgumentInLiteral(functorProvider, goal);
        instances.forEach((instance) => {
          let conjunctsCopy = conjuncts.concat([]);
          if (conjuncts[l] instanceof Timable) {
            conjunctsCopy[l] = new Timable(
              instance,
              conjuncts[l].getStartTime(),
              conjuncts[l].getEndTime()
            );
          } else {
            conjunctsCopy[l] = instance;
          }
          recursiveFunctorArgumentProcessing(conjunctsCopy, l + 1);
        });
        return;
      }
      recursiveFunctorArgumentProcessing(conjuncts, l + 1);
    };
    recursiveFunctorArgumentProcessing(r[0], 0);
    newChildren = newChildren.concat(nodes);
  });
  return newChildren;
};

function GoalNode(program, conjunctsArg, theta) {
  // deduplicate terms in the conjunction
  this.conjuncts = dedupeConjunction(conjunctsArg);

  this.theta = theta;
  this.children = [];
  this.hasBranchFailed = false;

  this.getEarliestDeadline = function getEarliestDeadline(currentTime) {
    let earliestDeadline = null;
    if (this.hasBranchFailed) {
      return null;
    }

    if (this.conjuncts.length === 0) {
      return -1;
    }

    let checkAndUpdateDeadline = (timing) => {
      if (timing instanceof Variable) {
        return;
      }
      if (earliestDeadline === null
          || (currentTime <= timing && timing < earliestDeadline)) {
        earliestDeadline = timing;
      }
    };

    if (this.children.length === 0) {
      this.conjuncts.forEach((conjunct) => {
        if (!(conjunct instanceof Timable)) {
          return;
        }
        checkAndUpdateDeadline(conjunct.getStartTime());
      });
      return earliestDeadline;
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
    leafNodes,
    evaluationQueue,
    processedNodes
  ) {
    let cachedValue = processedNodes.get(this.conjuncts);
    if (cachedValue !== undefined) {
      if (cachedValue === null) {
        this.hasBranchFailed = true;
      }
      return cachedValue;
    }

    if (hasExpiredTimable(this.conjuncts, forTime)) {
      processedNodes.add(this.conjuncts, null);
      return null;
    }

    if (this.conjuncts.length === 0) {
      return [[this.theta]];
    }

    let pair = sortTimables(this.conjuncts, forTime);
    let earlyConjuncts = pair[0];
    let laterConjuncts = pair[1];

    if (earlyConjuncts.length === 0) {
      leafNodes.push(this);
      evaluationQueue.push(this);
      processedNodes.add(this.conjuncts, []);
      return [];
    }

    let reductionResult = [];

    let usedVariables = {};
    for (let j = 0; j < this.conjuncts.length; j += 1) {
      this.conjuncts[j].getVariableHash(usedVariables);
    }
    usedVariables = Object.keys(usedVariables);

    let hasMacroExpansion = false;
    for (let i = 0; i < earlyConjuncts.length; i += 1) {
      let conjunct = earlyConjuncts[i];

      let otherLiteralsFront = earlyConjuncts.slice(0, i);
      let otherLiteralsBack = earlyConjuncts.slice(i + 1, earlyConjuncts.length);
      let compositeReductionResult = reduceCompositeEvent(
        conjunct,
        program,
        usedVariables
      );
      if (compositeReductionResult.length === 0) {
        if (conjunct instanceof Timable
            && program.isAction(conjunct.getGoal())
            && !conjunct.hasExpired(forTime + 1)) {
          continue;
        }
        // if there's no reduction for this conjunct, break
        break;
      }
      for (let k = 0; k < compositeReductionResult.length; k += 1) {
        let crrArg = compositeReductionResult[k];
        // crr needs to rename variables to avoid clashes
        // also at the same time handle any output variables
        let mapper = (term) => {
          return term.substitute(crrArg.theta);
        };
        let remappedClauseFront = otherLiteralsFront.map(mapper);
        let remappedClauseBack = otherLiteralsBack.map(mapper);
        let remappedLaterConjuncts = laterConjuncts.map(mapper);
        let newConjuncts = remappedClauseFront
          .concat(crrArg.conjuncts)
          .concat(remappedClauseBack)
          .concat(remappedLaterConjuncts);
        reductionResult.push([newConjuncts, crrArg.theta]);
      }

      hasMacroExpansion = true;
      break;
    }

    let isFirstConjunctUntimed = earlyConjuncts[0] instanceof Timable
      && earlyConjuncts[0].isAnytime();

    if (!hasMacroExpansion) {
      let stateConditionResolutionResult = resolveStateConditions(
        program,
        earlyConjuncts,
        forTime
      );
      if (stateConditionResolutionResult === null
          && !isFirstConjunctUntimed) {
        this.hasBranchFailed = true;
        processedNodes.add(this.conjuncts, null);
        return null;
      }
      if (stateConditionResolutionResult !== null) {
        stateConditionResolutionResult.forEach((tuple) => {
          let substitutedLaterConjuncts = laterConjuncts
            .map((conjunct) => {
              return conjunct.substitute(tuple.theta);
            });
          let newNodeConjuncts = tuple.conjuncts
            .concat(substitutedLaterConjuncts);
          reductionResult.push([newNodeConjuncts, tuple.theta]);
        });
      }
    }

    // check for expired conjuncts
    reductionResult = reductionResult.filter((n) => {
      return !hasExpiredTimable(n[0], forTime);
    });

    let newChildren = processArgumentFunctorsInClause(program, reductionResult)
      .map(node => new GoalNode(program, node[0], node[1]));
    this.children = this.children.concat(newChildren);

    let numFailed = 0;
    for (let i = 0; i < newChildren.length; i += 1) {
      let result = newChildren[i].evaluate(
        forTime,
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
      processedNodes.add(this.conjuncts, nodeResult);
      return nodeResult;
    }

    if (!isFirstConjunctUntimed
        && newChildren.length > 0
        && numFailed === newChildren.length) {
      processedNodes.add(this.conjuncts, null);
      this.hasBranchFailed = true;
      return null;
    }

    if (newChildren.length === 0) {
      leafNodes.push(this);
    }

    if (newChildren.length === 0 || (!hasMacroExpansion && isFirstConjunctUntimed)) {
      evaluationQueue.push(this);
    } else {
      processedNodes.add(this.conjuncts, []);
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
  let _rootNodeMap = new ConjunctionMap();
  _rootNodeMap.add(goalClause, null);

  this.isSameRootConjunction = function isSameRootConjunction(otherGoal) {
    return _rootNodeMap.get(otherGoal) === null;
  };

  this.getEarliestDeadline = function getEarliestDeadline(currentTime) {
    let earliestDeadline = null;
    for (let i = 0; i < _evaluateQueue.length; i += 1) {
      let earliestForNode = _evaluateQueue[i].getEarliestDeadline(currentTime);
      if (earliestDeadline === null
          || (earliestForNode < earliestDeadline)) {
        earliestDeadline = earliestForNode;
      }
    }
    return earliestDeadline;
  };

  this.getRootClause = function () {
    return _root.conjuncts.map(l => '' + l);
  };

  this.evaluate = function evaluate(forTime) {
    return new Promise((resolve) => {
      if (_evaluateQueue.length === 0) {
        resolve(null);
        return;
      }

      setTimeout(() => {
        _leafNodes = [];
        let newEvaluateQueue = [];
        let result = [];
        let processedNodes = new ConjunctionMap();

        for (let i = 0; i < _evaluateQueue.length; i += 1) {
          let node = _evaluateQueue[i];
          let nodeResult = node.evaluate(
            forTime,
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
    currentTime,
    callback
  ) {
    let functorProvider = program.getFunctorProvider();

    _leafNodes.forEach((node) => {
      let candidateActionSets = [];
      let unresolvedSets = [];

      let pair = sortTimables(node.conjuncts, currentTime);
      let earlyConjuncts = pair[0];
      // later conjuncts are ignored

      let numCandidateActionsAdded = resolveSimpleActions(
        earlyConjuncts,
        program,
        functorProvider,
        candidateActionSets,
        unresolvedSets
      );

      if (numCandidateActionsAdded === 0) {
        return;
      }

      for (let i = 0; i < candidateActionSets.length; i += 1) {
        let unresolved = unresolvedSets[i];
        if (hasExpiredTimable(unresolved, currentTime)) {
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
          conjuncts: '' + node.conjuncts
        };
      }
      return {
        hasFailed: node.hasBranchFailed,
        conjuncts: '' + node.conjuncts,
        children: children
      };
    };

    return JSON.stringify(processNode(_root));
  };
}

module.exports = GoalTree;
