const BuiltInFunctorProvider = require('./BuiltInFunctorProvider');
const Clause = require('./Clause');
const Functor = require('./Functor');
const LiteralTreeMap = require('./LiteralTreeMap');
const Unifier = require('./Unifier');
const Variable = require('./Variable');
const variableArrayRename = require('../utility/variableArrayRename');

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
      let newUnifications;
      if (substitutedLiteral.isGround() && builtInFunctorProvider.has(substitutedLiteral.getId())) {
        newUnifications = builtInFunctorProvider.execute(substitutedLiteral);
      } else {
        newUnifications = Resolutor.findUnifications(substitutedLiteral, facts);
      }
      newUnifications.forEach((newUnification) => {
        currentUnifications.push(Resolutor.compactTheta(theta, newUnification.theta));
      });
    });
    return recursivelyFindUnifications(currentUnifications, idx + 1);
  };
  return recursivelyFindUnifications([{}], 0);
};

function Resolutor(factsArg) {
  let facts = factsArg;
  if (facts instanceof LiteralTreeMap) {
    facts = [facts];
  }
  let newFacts = new LiteralTreeMap();

  let builtInFunctorProvider = new BuiltInFunctorProvider((literal) => {
    return Resolutor.findUnifications(literal, facts);
  });

  let resolveForClause = (programWithoutClause, clause, idx) => {
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
          let headUnifications = Resolutor.findUnifications(substitutedLiteral, facts);
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
      let subresolutor = new Resolutor(facts.concat([thetaFacts]));
      if (subresolutor.resolve(programWithoutClause) === null) {
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
        let result = resolveForClause(_programWithoutClause[i], program[i], i);
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
    while (substitution instanceof Variable && theta2[substitution.evaluate()] !== undefined) {
      if (theta2[substitution.evaluate()] instanceof Variable
          && substitution.evaluate() === theta2[substitution.evaluate()].evaluate()) {
        break;
      }
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

Resolutor.handleBuiltInFunctorArgumentInLiteral = function handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, literal) {
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
  let unifications = []
  for (let i = 0; i < facts.length; i += 1) {
    let unification = facts[i].unifies(literal);
    unifications = unifications.concat(unification);
  }
  return unifications;
};

Resolutor.reduceRuleAntecdent = function reduceRuleAntecdent(builtInFunctorProvider, rule, factsArg) {
  let facts = factsArg;
  if (facts instanceof LiteralTreeMap) {
    facts = [facts];
  }


  let literals = rule.getBodyLiterals();
  let thetaSet = [{ theta: {}, unresolved: [] }];
  literals.forEach((literal) => {
    let newThetaSet = [];
    thetaSet.forEach((pair) => {
      let substitutedLiteral = literal.substitute(pair.theta);
      let literalThetas = [];
      if (substitutedLiteral.isGround() && builtInFunctorProvider.has(substitutedLiteral.getId())) {
        literalThetas = builtInFunctorProvider.execute(substitutedLiteral);
      } else {
        let substitutedInstances = Resolutor.handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, substitutedLiteral);
        substitutedInstances.forEach((literal) => {
          literalThetas = literalThetas.concat(Resolutor.findUnifications(literal, facts));
        });
      }
      if (literalThetas.length === 0) {
        newThetaSet.push({
          theta: pair.theta,
          unresolved: pair.unresolved.concat([substitutedLiteral])
        });
        return;
      }
      literalThetas.forEach((t) => {
        newThetaSet.push({
          theta: Resolutor.compactTheta(pair.theta, t.theta),
          unresolved: pair.unresolved
        });
      })
    });
    thetaSet = newThetaSet;
  });
  return thetaSet;
};


Resolutor.processRules = function processRules(rules, goals, fluents, actions, factsArg) {
  let facts = factsArg;
  if (facts instanceof LiteralTreeMap) {
    facts = [facts];
  }

  let containsTimables = function(rule) {
    let bodyLiterals = rule.getBodyLiterals();
    let result = false;
    bodyLiterals.forEach((literal) => {
      if (fluents[literal.getId()] || actions[literal.getId()]) {
        result = true;
      }
    })
    return result;
  }

  let builtInFunctorProvider = new BuiltInFunctorProvider((literal) => {
    return Resolutor.findUnifications(literal, facts);
  });

  let newRules = [];
  rules.forEach((rule) => {
    if (containsTimables(rule)) {
      newRules.push(rule);
    }
    let resolutions = Resolutor.reduceRuleAntecdent(builtInFunctorProvider, rule, facts);
    let consequentLiterals = rule.getHeadLiterals();
    resolutions.forEach((pair) => {
      if (pair.unresolved.length === rule.getBodyLiteralsCount()) {
        return;
      }
      let substitutedConsequentLiterals = consequentLiterals.map(l =>  l.substitute(pair.theta));
      if (pair.unresolved.length === 0) {
        console.log('adding: ' + substitutedConsequentLiterals);

        goals.push(substitutedConsequentLiterals);
        return;
      }
      newRules.push(new Clause(substitutedConsequentLiterals, pair.unresolved.map(l => l.substitute(pair.theta))));
    });
  });
  return newRules;
};

Resolutor.reduceCompositeEvent = function reduceCompositeEvent(eventAtom, program) {
  let reductions = [];
  let assumption = new LiteralTreeMap();
  assumption.add(eventAtom);

  program.forEach((clause) => {
    if (clause.isConstraint()) {
      return;
    }
    let headLiterals = clause.getHeadLiterals();
    let unifications = Resolutor.findUnifications(headLiterals[0], [assumption]);
    unifications.forEach((pair) => {
      reductions.push(clause.getBodyLiterals().map(l => l.substitute(pair.theta)));
    });
  });

  return reductions;
};

module.exports = Resolutor;
