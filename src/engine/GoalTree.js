/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Resolutor = lpsRequire('engine/Resolutor');
const Functor = lpsRequire('engine/Functor');
const Timable = lpsRequire('engine/Timable');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const variableArrayRename = lpsRequire('utility/variableArrayRename');
const compactTheta = lpsRequire('utility/compactTheta');
const dedupeConjunction = lpsRequire('utility/dedupeConjunction');
const sortTimables = lpsRequire('utility/sortTimables');
const resolveTimableThetaTiming = lpsRequire('utility/resolveTimableThetaTiming');
const expandLiteral = lpsRequire('utility/expandLiteral');
const ConjunctionMap = lpsRequire('engine/ConjunctionMap');

const reduceCompositeEvent = function reduceCompositeEvent(conjunct, program, renameTheta) {
  return expandLiteral(conjunct, program, renameTheta);
};

const resolveStateConditions = function resolveStateConditions(
  engine,
  program,
  earlyConjuncts,
  forTime
) {
  let state = [
    program.getFacts(),
    program.getState(),
    program.getExecutedActions()
  ];
  let functorProvider = engine.getFunctorProvider();
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
    } // empty conjunct list

    let newTheta = Object.assign({}, thetaSoFar);
    let conjunct = remainingConjuncts[0].substitute(newTheta);
    let thetaDelta = resolveTimableThetaTiming(conjunct, newTheta, forTime);
    let goal = conjunct
      .getGoal()
      .substitute(thetaDelta);
    let isConjunctAction = program.isAction(goal);
    let otherConjuncts = remainingConjuncts.slice(1);

    if (isConjunctAction) {
      let timableStartTime = conjunct.getStartTime();
      if (timableStartTime instanceof Value && timableStartTime.evaluate() === forTime) {
        // action to be executed later
        return processConjuncts(
          otherConjuncts,
          residueConjuncts.concat([conjunct]),
          thetaSoFar
        );
      }
    }

    if (goal.getId() === 'cut/0') {
      return processConjuncts(
        [],
        residueConjuncts.concat(otherConjuncts),
        thetaSoFar
      );
    }

    let literalThetas = Resolutor.queryState(goal, functorProvider, state);
    if (literalThetas.length === 0) {
      return false;
    }

    let conjunctVariables = conjunct.getVariables();
    let numFailures = 0;
    // process all branches
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

      // for now, we only immediately end processing
      let subResult = processConjuncts(
        [],
        residueConjuncts.concat(otherConjuncts),
        newThetaSoFar
      );
      if (!subResult) {
        numFailures += 1;
      }
    });

    // returns true if not all branches failed
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

const hasExpiredCandidateAction = function (conjuncts, forTime) {
  let result = false;
  for (let i = 0; i < conjuncts.length; i += 1) {
    let conjunct = conjuncts[i];
    if (!(conjunct instanceof Timable)) {
      continue;
    }
    let startTime = conjunct.getStartTime();
    if (startTime instanceof Value && startTime.evaluate() < forTime) {
      result = true;
      break;
    }
  }
  return result;
};

const processArgumentFunctorsInClause = function processArgumentFunctorsInClause(
  functorProvider,
  reductionResult
) {
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
          let conjunctsCopy = conjuncts.concat();
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

let buildRenameThetaForConjunction = function buildRenameThetaForConjunction(conjuncts) {
  let usedVariables = {};
  for (let j = 0; j < conjuncts.length; j += 1) {
    conjuncts[j].getVariableHash(usedVariables);
  }
  usedVariables = Object.keys(usedVariables);
  let renameTheta = variableArrayRename(usedVariables);
  return renameTheta;
};

function GoalNode(engine, program, conjunctsArg, theta) {
  // deduplicate terms in the conjunction
  this.conjuncts = dedupeConjunction(conjunctsArg);

  this.theta = theta;
  this.children = [];
  this.hasBranchFailed = false;

  this.renameTheta = buildRenameThetaForConjunction(this.conjuncts);

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
    if (this.conjuncts.length === 0) {
      return [[this.theta]];
    }

    let cachedValue = processedNodes.get(this.conjuncts);
    if (cachedValue !== undefined) {
      if (cachedValue === null) {
        this.hasBranchFailed = true;
      }
      return cachedValue;
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

    let hasMacroExpansion = false;
    for (let i = 0; i < earlyConjuncts.length; i += 1) {
      let conjunct = earlyConjuncts[i];

      let otherLiteralsFront = earlyConjuncts.slice(0, i);
      let otherLiteralsBack = earlyConjuncts.slice(i + 1, earlyConjuncts.length);
      let compositeReductionResult = reduceCompositeEvent(
        conjunct,
        program,
        this.renameTheta
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
        // need to handle any output variables
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

    // resolve state condition for the first early conjunct
    let stateConditionResolutionResult = resolveStateConditions(
      engine,
      program,
      earlyConjuncts,
      forTime
    );
    if (!hasMacroExpansion
        && stateConditionResolutionResult === null
        && !isFirstConjunctUntimed) {
      // if there were no macro expansion and the processed conjunct was not untimed, and it failed
      // then this node has failed indefinitely
      this.hasBranchFailed = true;
      processedNodes.add(this.conjuncts, null);
      return null;
    }
    if (stateConditionResolutionResult !== null) {
      // process successful results
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

    let newChildren = processArgumentFunctorsInClause(engine.getFunctorProvider(), reductionResult)
      .map(node => new GoalNode(engine, program, node[0], node[1]));
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

function GoalTree(engine, program, goalClause, birthTimestamp) {
  let _root;
  if (goalClause instanceof GoalNode) {
    _root = goalClause;
  } else {
    _root = new GoalNode(engine, program, goalClause, {});
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

  this.evaluate = function evaluate(forTime, processedNodes) {
    return new Promise((resolve) => {
      if (_evaluateQueue.length === 0) {
        resolve(null);
        return;
      }

      setImmediate(() => {
        _leafNodes = [];
        let newEvaluateQueue = [];
        let result = [];

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
      });
    });
  };

  this.forEachCandidateActions = function forEachCandidateActions(
    currentTime,
    callback
  ) {
    let functorProvider = engine.getFunctorProvider();

    let result = false;
    for (let j = 0; j < _leafNodes.length; j += 1) {
      let node = _leafNodes[j];
      let candidateActionSets = [];
      let unresolvedSets = [];

      // later conjuncts are ignored
      let pair = sortTimables(node.conjuncts, currentTime);
      let earlyConjuncts = pair[0];
      if (hasExpiredCandidateAction(earlyConjuncts, currentTime - 1)) {
        continue;
      }

      let numCandidateActionsAdded = resolveSimpleActions(
        earlyConjuncts,
        program,
        functorProvider,
        candidateActionSets,
        unresolvedSets
      );

      if (numCandidateActionsAdded === 0) {
        continue;
      }

      for (let i = 0; i < candidateActionSets.length; i += 1) {
        let candidateActions = candidateActionSets[i];
        result = callback(candidateActions);
        if (result) {
          break;
        }
      }
      if (result) {
        break;
      }
    }
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

    return JSON.stringify({
      birth: birthTimestamp,
      root: processNode(_root)
    });
  };
}

module.exports = GoalTree;
