const BuiltInFunctorProvider = require('./BuiltInFunctorProvider');
const Functor = require('./Functor');
const LiteralTreeMap = require('./LiteralTreeMap');
const compactTheta = require('../utility/compactTheta');

let resolveClauseBody;

function Resolutor(factsArg) {
  let facts = factsArg;
  if (facts instanceof LiteralTreeMap) {
    facts = [facts];
  }
  let newFacts = new LiteralTreeMap();

  let builtInFunctorProvider = new BuiltInFunctorProvider((literal) => {
    return Resolutor.findUnifications(literal, facts);
  });

  let resolveForClause = (programWithoutClause, clause) => {
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
      headLiterals.forEach((literal) => {
        let substitutedLiteral = literal.substitute(theta);
        if (!substitutedLiteral.isGround()) {
          let headUnifications = Resolutor.findUnifications(substitutedLiteral, facts);
          headUnifications.forEach((uni) => {
            processedThetaSet.push(compactTheta(theta, uni.theta));
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
      let subresolutor = new Resolutor(facts.concat([thetaFacts]));
      if (subresolutor.resolve(programWithoutClause) === null) {
        countRejected += 1;
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

  this.resolve = function resolve(program) {
    let _programWithoutClause = [];
    for (let i = 0; i < program.length; i += 1) {
      let clause = program[i];
      _programWithoutClause.push(program.filter(c => c !== clause));
    }

    let lastNewFactsCount;
    do {
      lastNewFactsCount = newFacts.size();
      for (let i = 0; i < program.length; i += 1) {
        let result = resolveForClause(_programWithoutClause[i], program[i]);
        if (!result) {
          return null;
        }
      }
    } while (lastNewFactsCount < newFacts.size());
    return newFacts;
  };
}

resolveClauseBody = function (bodyLiterals, facts, builtInFunctorProvider) {
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
      let newUnifications;
      if (substitutedLiteral.isGround() && builtInFunctorProvider.has(substitutedLiteral.getId())) {
        newUnifications = builtInFunctorProvider.execute(substitutedLiteral);
      } else {
        newUnifications = Resolutor.findUnifications(substitutedLiteral, facts);
      }
      newUnifications.forEach((newUnification) => {
        currentUnifications.push(compactTheta(theta, newUnification.theta));
      });
    });
    return recursivelyFindUnifications(currentUnifications, idx + 1);
  };
  return recursivelyFindUnifications([{}], 0);
};

Resolutor.handleBuiltInFunctorArgumentInLiteral =
  function handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, literal) {
    let literalName = literal.getName();
    let literalArgs = literal.getArguments();

    let result = [];
    let handleLiteralArg = (argsSoFar, idx) => {
      if (idx >= literalArgs.length) {
        result.push(new Functor(literalName, argsSoFar));
        return;
      }
      let arg = literalArgs[idx];
      if (arg instanceof Functor && builtInFunctorProvider.has(arg.getId())) {
        let executionResult = builtInFunctorProvider.execute(arg);
        executionResult.forEach((instance) => {
          if (instance.replacement === undefined) {
            return;
          }
          handleLiteralArg(argsSoFar.concat([instance.replacement]), idx + 1);
        });
        return;
      }
      handleLiteralArg(argsSoFar.concat([arg]), idx + 1);
    };
    handleLiteralArg([], 0);
    return result;
  };

Resolutor.findUnifications = function findUnifications(literal, factsArg) {
  let facts = factsArg;
  if (facts instanceof LiteralTreeMap) {
    facts = [facts];
  }
  let unifications = [];
  for (let i = 0; i < facts.length; i += 1) {
    let unification = facts[i].unifies(literal);
    unifications = unifications.concat(unification);
  }
  return unifications;
};

Resolutor.reduceRuleAntecedent =
  function reduceRuleAntecedent(builtInFunctorProvider, rule, factsArg) {
    let facts = factsArg;
    if (facts instanceof LiteralTreeMap) {
      facts = [facts];
    }

    let recursiveResolution = function(result, remainingLiterals, theta) {
      if (remainingLiterals.length === 0) {
        result.push({
          theta: theta,
          unresolved: []
        });
        return;
      }

      let literal = remainingLiterals[0].substitute(theta);
      let literalThetas = [];
      if (literal.isGround() && builtInFunctorProvider.has(literal.getId())) {
        literalThetas = builtInFunctorProvider.execute(literal);
      } else {
        let substitutedInstances = Resolutor
          .handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, literal);
        substitutedInstances.forEach((l) => {
          literalThetas = literalThetas.concat(Resolutor.findUnifications(l, facts));
        });
      }

      if (literalThetas.length === 0) {
        result.push({
          theta: theta,
          unresolved: remainingLiterals.concat([])
        });
        return;
      }

      literalThetas.forEach((t) => {
        recursiveResolution(result, remainingLiterals.slice(1, remainingLiterals.length), compactTheta(theta, t.theta));
      });
    };

    let literals = rule.getBodyLiterals();
    let thetaSet = [];
    recursiveResolution(thetaSet, literals, {});
    return thetaSet;
  };

module.exports = Resolutor;
