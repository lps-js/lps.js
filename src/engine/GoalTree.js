const LiteralTreeMap = require('./LiteralTreeMap');
const BuiltInFunctorProvider = require('./BuiltInFunctorProvider');
const Resolutor = require('./Resolutor');
const Variable = require('./Variable');
const variableArrayRename = require('../utility/variableArrayRename');
const compactTheta = require('../utility/compactTheta');

let reduceCompositeEvent = function reduceCompositeEvent(eventAtom, program, usedVariables) {
  let reductions = [];
  let assumption = new LiteralTreeMap();
  assumption.add(eventAtom);
  let renameTheta = variableArrayRename(usedVariables);

  program.forEach((clause) => {
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
      Object.keys(theta).forEach((varName) => {
        if (theta[varName] instanceof Variable) {
          // output variable
          outputTheta[theta[varName].evaluate()] = new Variable(varName);
          delete theta[varName];
        }
      });
      reductions.push({
        clause: clause.getBodyLiterals().map(l => l.substitute(theta).substitute(renameTheta)),
        theta: outputTheta,
        internalTheta: theta
      });
    });
  });

  return reductions;
};

let resolveStateConditions = function resolveStateConditions(clause, facts, builtInFunctorProvider) {
  let thetaSet = [];
  let literal = clause[0];
  let substitutedInstances = Resolutor.handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, literal);
  // console.log(substitutedInstances.map(l => ''+l));
  substitutedInstances.forEach((instance) => {
    if (thetaSet === null) {
      return;
    }
    let literalThetas = [];
    if (builtInFunctorProvider.has(instance.getId())) {
      literalThetas = builtInFunctorProvider.execute(instance);
      if (literalThetas.length === 0) {
        thetaSet = null;
        return;
      }
    } else {
      literalThetas = Resolutor.findUnifications(instance, facts);
    }
    let isGrounded = instance.isGround();
    if (literalThetas.length === 0) {
      if (isGrounded) {
        thetaSet = null;
        return;
      }
      return;
    }

    // resolved.add(instance);
    literalThetas.forEach((t) => {
      let replacement = clause.slice(1, clause.length)
        .map(l => l.substitute(t.theta));
      if (t.replacement !== undefined) {
        replacement = t.replacement.concat(replacement);
      }
      thetaSet.push({
        theta: t.theta,
        unresolved: replacement
      });
    });
  });
  if (thetaSet === null) {
    return null;
  }
  let nodes = [];
  thetaSet.forEach(t => {
    if (t.unresolved.length >= clause.length) {
      return;
    }
    nodes.push(new GoalNode(t.unresolved, t.theta, builtInFunctorProvider));
  });
  return nodes;
};

let resolveSimpleActions = function resolveSimpleActions(clause, possibleActions, builtInFunctorProvider, candidateActions) {
  let thetaSet = [{ theta: {}, unresolved: [], candidates: [] }];
  let hasUnresolvedClause = false;
  clause.forEach((literal) => {
    if (hasUnresolvedClause) {
      return;
    }
    let newThetaSet = [];
    thetaSet.forEach((tuple) => {
      let substitutedLiteral = literal.substitute(tuple.theta);
      let substitutedInstances = Resolutor.handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, substitutedLiteral);
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
    tuple.candidates.forEach((literal) => {
      candidateActions.add(literal);
    });
  });
};

function GoalNode(clause, theta, builtInFunctorProvider) {
  this.clause = clause;
  this.theta = theta;
  this.children = [];
  this.hasBranchFailed = false;
  this.builtInFunctorProvider = builtInFunctorProvider;

  this.forEachCandidateActions = function forEachCandidateActions(program, facts, possibleActions, callback) {
    if (this.hasBranchFailed) {
      return true;
    }

    if (this.children.length === 0) {
      let candidateActions = new LiteralTreeMap();
      resolveSimpleActions(this.clause, possibleActions, this.builtInFunctorProvider, candidateActions);
      return callback(candidateActions);
    }

    let result = [];
    for (let i = 0; i < this.children.length; i += 1) {
      let childResult = this.children[i].forEachCandidateActions(program, facts, possibleActions, callback);
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

  this.evaluate = function evaluate(program, isTimable, facts) {
    if (this.hasBranchFailed) {
      return null;
    }

    if (this.clause.length === 0) {
      return [[this.theta]];
    }

    // only attempt to resolve the first literal left to right
    let reductionResult = [];
    if (isTimable(this.clause[0]) || this.children.length === 0) {
      let stateConditionResolutionResult = resolveStateConditions(clause, facts, builtInFunctorProvider);
      if (stateConditionResolutionResult === null) {
        this.hasBranchFailed = true;
        // node failed indefinitely
        return null;
      }
      reductionResult = reductionResult.concat(stateConditionResolutionResult);
    }
    if (this.children.length === 0) {
      for (let i = 0; i < 1; i += 1) {
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
        let compositeReductionResult = reduceCompositeEvent(clause[i], program, usedVariables);
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
          reductionResult.push(new GoalNode(newClause, crrArg.theta, this.builtInFunctorProvider));
        });
      }
    }

    reductionResult.forEach((r) => {
      this.children.push(r);
    });

    let nodeResult = [];
    let numFailed = 0;

    for (let i = 0; i < this.children.length; i += 1) {
      let result = this.children[i].evaluate(program, facts);
      if (result === null || result.length === 0) {
        continue
      }
      result.forEach((subpath) => {
        nodeResult.push([this.theta].concat(subpath));
      });
      return nodeResult;
    }
    if (this.checkIfBranchFailed()) {
      return null;
    }

    return nodeResult;
  };
}

function GoalTree(goalClause, builtInFunctorProvider) {
  let _root = new GoalNode(goalClause, {}, builtInFunctorProvider);

  this.checkTreeFailed = function checkTreeFailed() {
    return _root.checkIfBranchFailed();
  };

  this.getRootClause = function () {
    return _root.clause.map(l => '' + l);
  };

  this.evaluate = function evaluate(program, isTimable, facts) {
    return _root.evaluate(program, isTimable, facts);
  };

  this.forEachCandidateActions = function forEachCandidateActions(program, facts, possibleActions, callback) {
    _root.forEachCandidateActions(program, facts, possibleActions, callback);
  };
}

module.exports = GoalTree;
