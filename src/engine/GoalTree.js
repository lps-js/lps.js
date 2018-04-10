const LiteralTreeMap = require('./LiteralTreeMap');
const Resolutor = require('./Resolutor');
const Value = require('./Value');

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
    let headLiterals = clause.getHeadLiterals();
    let unifications = assumption.unifies(headLiterals[0]);
    unifications.forEach((pair) => {
      reductions.push(clause.getBodyLiterals().map(l => l.substitute(pair.theta)));
    });
  });

  return reductions;
};

let resolveStateConditions = function resolveStateConditions(clause, facts) {
  let thetaSet = [{ theta: {}, unresolved: [] }];
  clause.forEach((literal) => {
    let newThetaSet = [];
    thetaSet.forEach((tuple) => {
      let substitutedLiteral = literal.substitute(tuple.theta);
      let literalThetas = Resolutor.findUnifications(substitutedLiteral, facts);
      if (literalThetas.length === 0) {
        newThetaSet.push({
          theta: tuple.theta,
          unresolved: tuple.unresolved.concat([substitutedLiteral])
        });
        return;
      }
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
        newThetaSet.push({
          theta: Resolutor.compactTheta(tuple.theta, t.theta),
          unresolved: tuple.unresolved,
          candidates: tuple.candidates.concat([substitutedLiteral]).map(l => l.substitute(compactedTheta))
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

function GoalNode (clause) {
  this.clause = clause;
  this.children = [];

  this.evaluate = function evaluate(program, possibleActions, candidateActions, facts) {
    if (clause.length === 0) {
      return true;
    }

    let reductionResult = [];
    for (let i = 0; i < this.clause.length; i += 1) {
      reductionResult = reductionResult.concat(reduceCompositeEvent(clause[i], program));
    }
    reductionResult = reductionResult.concat(resolveStateConditions(clause, facts));

    reductionResult.forEach((r) => {
      //console.log(r);
      this.children.push(new GoalNode(r));
    });
    resolveSimpleActions(clause, possibleActions, candidateActions)

    for (let i = 0; i < this.children.length; i += 1) {
      let result = this.children[i].evaluate(program, possibleActions, candidateActions, facts);
      if (result) {
        return true;
      }
    }
    return false;
  }
}

function GoalTree(goalClause) {
  let _root = new GoalNode(goalClause);

  this.evaluate = function evaluate(program, possibleActions, candidateActions, facts) {
    return _root.evaluate(program, possibleActions, candidateActions, facts);
  };
}

module.exports = GoalTree;
