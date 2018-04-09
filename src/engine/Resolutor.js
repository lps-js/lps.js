const BuiltInFunctorProvider = require('./BuiltInFunctorProvider');
const Clause = require('./Clause');
const Functor = require('./Functor');
const LiteralTreeMap = require('./LiteralTreeMap');
const Unifier = require('./Unifier');
const Variable = require('./Variable');
const variableArrayRename = require('../utility/variableArrayRename');

let findUnifications = function findUnifications(literal, facts) {
  let unifications = []
  for (let i = 0; i < facts.length; i += 1) {
    let unification = facts[i].unifies(literal);
    unifications = unifications.concat(unification);
  }
  return unifications;
};

let resolveClauseBody = (bodyLiterals, facts, builtInFunctorProvider) => {
  let recursivelyFindUnifications = (unifications, idx) => {
    if (unifications.length === 0) {
      return null;
    }
    if (idx >= bodyLiterals.length) {
      return unifications;
    }
    let literal = bodyLiterals[idx];
    let currentUnifications = [];
    unifications.forEach((theta) => {
      let substitutedLiteral = literal.substitute(theta);
      if (builtInFunctorProvider.has(substitutedLiteral.getId())) {
        if (builtInFunctorProvider.execute(substitutedLiteral)) {
          currentUnifications.push(theta);
        }
        return;
      }
      let newUnifications = findUnifications(substitutedLiteral, facts);
      newUnifications.forEach((newUnification) => {
        currentUnifications.push(Resolutor.compactTheta(theta, newUnification.theta));
      });
    });
    return recursivelyFindUnifications(currentUnifications, idx + 1);
  };
  return recursivelyFindUnifications([{}], 0);
};

function Resolutor(program, factsArg) {
  let facts = factsArg;
  if (facts instanceof LiteralTreeMap) {
    facts = [facts];
  }
  let newFacts = new LiteralTreeMap();

  let builtInFunctorProvider = new BuiltInFunctorProvider((literal) => {
    return findUnifications(literal, facts);
  });

  let _programWithoutClause = [];
  for (let i = 0; i < program.length; i += 1) {
    let clause = program[i];
    _programWithoutClause.push(program.filter(c => c !== clause));
  }

  let resolveForClause = (clause, idx) => {
    let thetaSet = resolveClauseBody(clause.getBodyLiterals(), facts, builtInFunctorProvider);
    if (thetaSet === null) {
      return true;
    }
    if (clause.isConstraint()) {
      return false;
    }

    let headLiterals = clause.getHeadLiterals();
    let processedThetaSet = [];
    thetaSet.forEach((theta) => {
      let isAllGround = true;
      headLiterals.forEach((literal) => {
        let substitutedLiteral = literal.substitute(theta);
        if (!substitutedLiteral.isGround()) {
          isAllGround = false;
          let headUnifications = findUnifications(substitutedLiteral, facts);
          headUnifications.forEach((uni) => {
            processedThetaSet.push(Resolutor.compactTheta(theta, uni.theta));
          });
        }
      });

      processedThetaSet.push(theta);
    });

    let countRejected = 0;
    processedThetaSet.forEach((theta) => {
      let thetaFacts = new LiteralTreeMap();
      headLiterals.forEach((literal) => {
        let substitutedLiteral = literal.substitute(theta);
        thetaFacts.add(substitutedLiteral);
      });
      // check whether other clauses would accept this set of facts or not
      let subresolutor = new Resolutor(_programWithoutClause[idx], facts.concat([thetaFacts]));
      if (subresolutor.resolve() === null) {
        ++countRejected;
        return;
      }
      thetaFacts.forEach((l) => {
        newFacts.add(l);
      });
    });

    if (countRejected === processedThetaSet.length) {
      return false;
    }

    return true;
  };

  this.resolve = function resolve() {
    let lastNewFactsCount;
    do {
      lastNewFactsCount = newFacts.size();
      for (let i = 0; i < program.length; i += 1) {
        let result = resolveForClause(program[i], i);
        if (!result) {
          return null;
        }
      }
    } while(lastNewFactsCount < newFacts.size());
    return newFacts;
  };
}


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

module.exports = Resolutor;
