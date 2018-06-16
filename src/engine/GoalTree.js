const LiteralTreeMap = require('./LiteralTreeMap');
const Resolutor = require('./Resolutor');
const Variable = require('./Variable');
const variableArrayRename = require('../utility/variableArrayRename');
const compactTheta = require('../utility/compactTheta');
const constraintCheck = require('../utility/constraintCheck');

let reduceCompositeEvent = function reduceCompositeEvent(eventAtom, clauses, usedVariables) {
  let reductions = [];
  let assumption = new LiteralTreeMap();
  assumption.add(eventAtom);
  let renameTheta = variableArrayRename(usedVariables);

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
      // theta = compactTheta(theta, renameTheta)
      let outputTheta = {};
      Object.keys(theta).forEach((varName) => {
        if (theta[varName] instanceof Variable) {
          // output variable
          outputTheta[theta[varName].evaluate()] = new Variable(varName);
          delete theta[varName];
        }
      });

      reductions.push({
        clause: clause.getBodyLiterals().map(l => l.substitute(renameTheta).substitute(theta)),
        theta: outputTheta,
        internalTheta: theta
      });
    });
  });

  return reductions;
};

let resolveStateConditions = function resolveStateConditions(program, clause, possibleActions) {
  let functorProvider = program.getFunctorProvider();
  let thetaSet = [];
  let newThetaSet = [
    {
      theta: {},
      unresolved: clause,
      processing: true
    }
  ];
  let numResolved = 0;

  do {
    numResolved = 0;

    thetaSet = newThetaSet;
    newThetaSet = [];
    thetaSet.forEach((tuple) => {
      if (!tuple.processing) {
        newThetaSet.push(tuple);
        return;
      }
      let literalThetas = [];
      let skippedLiterals = [];
      let backUnprocessed = tuple.unresolved;
      let hasSelectedLiteral = false;
      let hasFailedIndefinitely = false;
      let variablesSeenBefore = {};
      for (let k = 0; k < tuple.unresolved.length; k += 1) {
        let literal = tuple.unresolved[k];
        let canProceed = true;
        literal.getVariables().forEach((v) => {
          if (variablesSeenBefore[v] !== undefined) {
            canProceed = false;
          }
        });
        if (!canProceed) {
          break;
      }
        let numSubstitutionFailure = 0;
        let substitutedInstances = Resolutor.handleBuiltInFunctorArgumentInLiteral(functorProvider, literal);
        substitutedInstances.forEach((instance) => {
          let subLiteralThetas = [];
          subLiteralThetas = subLiteralThetas.concat(program.query(instance));

          if (subLiteralThetas.length === 0) {
            let isActionCheck = possibleActions.unifies(instance);
            if (instance.isGround() && isActionCheck.length === 0) {
              numSubstitutionFailure += 1;
            }
            return;
          }

          literalThetas = literalThetas.concat(subLiteralThetas);
        });
        if (numSubstitutionFailure === substitutedInstances.length) {
          hasFailedIndefinitely = true;
        }
        if (hasFailedIndefinitely) {
          break;
        }
        if (literalThetas.length > 0) {
          hasSelectedLiteral = true;
          backUnprocessed = tuple.unresolved.slice(k + 1, tuple.unresolved.length);
          break;
        }
        skippedLiterals.push(literal);
        literal.getVariables().forEach((v) => {
          variablesSeenBefore[v] = true;
        });
      }
      if (hasFailedIndefinitely) {
        return;
      }
      if (!hasSelectedLiteral) {
        tuple.processing = false;
        newThetaSet.push(tuple);
        return;
      }

      literalThetas.forEach((t) => {
        let newTheta = compactTheta(tuple.theta, t.theta);
        let replacementFront = skippedLiterals
          .map(l => l.substitute(newTheta));
        let replacementBack = backUnprocessed
          .map(l => l.substitute(newTheta));
        let replacement;
        if (t.replacement === undefined) {
          replacement = replacementFront.concat(replacementBack);
        } else {
          replacement = replacementFront.concat(t.replacement)
            .concat(replacementBack);
        }
        newThetaSet.push({
          theta: newTheta,
          unresolved: replacement,
          processing: false
        });
        numResolved += 1;
      });
    });
    if (newThetaSet.length === 0 || newThetaSet === null) {
      return null;
    }
  } while (numResolved > 0);
  thetaSet = newThetaSet;

  // convert to nodes
  let nodes = [];
  thetaSet.forEach(t => {
    if (t.unresolved.length >= clause.length) {
      return;
    }
    nodes.push(new GoalNode(t.unresolved, t.theta));
  });
  return nodes;
};

let resolveSimpleActions = function resolveSimpleActions(clause, possibleActions, functorProvider, candidateActionSets) {
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

  thetaSet.forEach((tuple) => {
    let newSet = new LiteralTreeMap();
    tuple.candidates.forEach((literal) => {
      newSet.add(literal);
    });
    candidateActionSets.push(newSet);
  });
};

function GoalNode(clause, theta) {
  this.clause = clause;
  this.theta = theta;
  this.children = [];
  this.hasBranchFailed = false;

  this.forEachCandidateActions = function forEachCandidateActions(program, functorProvider, possibleActions, callback) {
    if (this.hasBranchFailed) {
      return true;
    }

    if (this.children.length === 0) {
      let candidateActionSets = [];
      resolveSimpleActions(this.clause, possibleActions, functorProvider, candidateActionSets);

      let continueCondition = true;
      candidateActionSets.forEach((candidateActions) => {
        if (!continueCondition) {
          return;
        }
        if (candidateActions.size() === 0) {
          return;
        }

        let subtree = new GoalTree(this.clause);
        continueCondition = callback(candidateActions, subtree);
      });
      return continueCondition;
    }

    let result = [];
    for (let i = 0; i < this.children.length; i += 1) {
      let childResult = this.children[i]
        .forEachCandidateActions(program, functorProvider, possibleActions, callback);
      if (!childResult) {
        return false;
      }
    }
    return true;
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

  this.evaluate = function evaluate(program, isTimable, possibleActions) {
    if (this.hasBranchFailed) {
      return null;
    }

    if (this.clause.length === 0) {
      return [[this.theta]];
    }

    // only attempt to resolve the first literal left to right
    let reductionResult = [];
    let processCompositeEvent = true;
    if ((isTimable(this.clause[0]) && !this.clause[0].isGround()) || this.children.length === 0) {
      let stateConditionResolutionResult = resolveStateConditions(program, clause, possibleActions);
      if (this.children.length === 0) {
        if ((!isTimable(this.clause[0]) || this.clause[0].isGround()) && stateConditionResolutionResult === null) {
          this.hasBranchFailed = true;
          // node failed indefinitely
          return null;
        }
      }
      if (stateConditionResolutionResult !== null) {
        reductionResult = reductionResult.concat(stateConditionResolutionResult);
      } else {
        processCompositeEvent = false;
      }
    }
    if (processCompositeEvent && this.children.length === 0 && reductionResult.length === 0) {
      for (let i = 0; i < this.clause.length; i += 1) {
        let literal = this.clause[i];
        let usedVariables = {};
        let otherLiteralsFront = this.clause.slice(0, i);
        let otherLiteralsBack = this.clause.slice(i + 1, this.clause.length);
        otherLiteralsFront.forEach((l) => {
          l.getVariables().forEach((v) => {
            usedVariables[v] = true;
          });
        });
        otherLiteralsBack.forEach((l) => {
          l.getVariables().forEach((v) => {
            usedVariables[v] = true;
          });
        });
        usedVariables = Object.keys(usedVariables);
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
        if (reductionResult.length > 0) {
          break;
        }
      }
    }

    reductionResult.forEach((r) => {
      this.children.push(r);
    });

    for (let i = 0; i < this.children.length; i += 1) {
      let result = this.children[i].evaluate(program, isTimable, possibleActions);
      if (result === null || result.length === 0) {
        continue;
      }
      let nodeResult = [];
      result.forEach((subpath) => {
        nodeResult.push([this.theta].concat(subpath));
      });
      return nodeResult;
    }

    if (this.checkIfBranchFailed()) {
      return null;
    }

    return [];
  };
}

function GoalTree(goalClause) {
  let _root = new GoalNode(goalClause, {});

  this.checkTreeFailed = function checkTreeFailed() {
    return _root.checkIfBranchFailed();
  };

  this.getRootClause = function () {
    return _root.clause.map(l => '' + l);
  };

  this.evaluate = function evaluate(program, isTimable, possibleActions) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = _root.evaluate(program, isTimable, possibleActions);
        resolve(result);
      }, 0)
    });
  };

  this.forEachCandidateActions = function forEachCandidateActions(program, possibleActions, callback) {
    let functorProvider = program.getFunctorProvider();
    _root.forEachCandidateActions(program, functorProvider, possibleActions, callback);
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
