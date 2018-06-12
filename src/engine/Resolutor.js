const Functor = require('./Functor');
const LiteralTreeMap = require('./LiteralTreeMap');
const variableArrayRename = require('../utility/variableArrayRename');
const compactTheta = require('../utility/compactTheta');
const Unifier = require('./Unifier');
const Variable = require('./Variable');

function Resolutor() {}

Resolutor.handleBuiltInFunctorArgumentInLiteral =
  function handleBuiltInFunctorArgumentInLiteral(functorProvider, literal) {
    let literalName = literal.getName();
    let literalArgs = literal.getArguments();

    let result = [];
    let handleLiteralArg = (argsSoFar, idx) => {
      if (idx >= literalArgs.length) {
        result.push(new Functor(literalName, argsSoFar));
        return;
      }
      let arg = literalArgs[idx];
      if (arg instanceof Functor && functorProvider.has(arg.getId())) {
        let executionResult = functorProvider.execute(arg);
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

Resolutor.explain =
  function explain(queryArg, program, otherFacts) {
    let clauses = program.getClauses();
    let functorProvider = program.getFunctorProvider();
    let facts = [
      program.getFacts(),
      program.getState(),
      program.getExecutedActions()
    ];
    if (otherFacts !== undefined) {
      if (otherFacts instanceof LiteralTreeMap) {
        facts.push(otherFacts)
      } else if (otherFacts instanceof Array) {
        facts = facts.concat(otherFacts);
      }
    }

    let query = queryArg;
    if (query instanceof Functor) {
      query = [query];
    }

    let recursiveResolution = function(remainingLiterals, thetaSoFar) {
      let result = [];
      if (remainingLiterals.length === 0) {
        result.push({
          theta: thetaSoFar
        });
        return result;
      }

      let literal = remainingLiterals[0].substitute(thetaSoFar);
      let literalThetas = [];
      let substitutedInstances = Resolutor
        .handleBuiltInFunctorArgumentInLiteral(functorProvider, literal);
      substitutedInstances.forEach((l) => {
        if (functorProvider.has(l.getId())) {
          literalThetas = literalThetas.concat(functorProvider.execute(l));
        }
        literalThetas = literalThetas.concat(Resolutor.findUnifications(l, facts));
      });

      let variablesInUse = {};
      for (let i = 1; i < remainingLiterals.length; i += 1) {
        let otherLiteral = remainingLiterals[i];
        otherLiteral.getVariables().forEach((v) => {
          variablesInUse[v] = true;
        });
      }
      variablesInUse = Object.keys(variablesInUse);

      clauses.forEach((clause) => {
        if (clause.isConstraint()) {
          // skip constraints
          return;
        }
        // horn clause guarantees only one literal
        let headLiteral = clause.getHeadLiterals()[0];
        let unificationTheta = Unifier.unifies([[literal, headLiteral]]);
        if (unificationTheta === null) {
          return;
        }

        let bodyLiterals = clause.getBodyLiterals();
        let renameTheta = variableArrayRename(variablesInUse);
        bodyLiterals = bodyLiterals.map((blArg) => {
          let bl = blArg.substitute(unificationTheta);
          return bl.substitute(renameTheta);
        });
        let newTheta = compactTheta(thetaSoFar, unificationTheta);
        let subResult = recursiveResolution(bodyLiterals, newTheta);
        literalThetas = literalThetas.concat(subResult);
      });

      if (literalThetas.length === 0) {
        return [];
      }

      let newRemainingLiterals = remainingLiterals.slice(1, remainingLiterals.length);

      literalThetas.forEach((t) => {
        if (result === null) {
          return;
        }
        let compactedTheta = compactTheta(thetaSoFar, t.theta);
        Object.keys(compactedTheta).forEach((k) => {
          if (compactedTheta[k] instanceof Variable) {
            let otherName = compactedTheta[k].evaluate();
            if (t.theta[otherName] != undefined) {
              compactedTheta[k] = t.theta[otherName];
            }
          }
        });
        let subResult = recursiveResolution(newRemainingLiterals, compactedTheta);
        result = result.concat(subResult);
      });
      return result;
    };

    let result = recursiveResolution(query, {});
    return result;
  };

Resolutor.reduceRuleAntecedent =
  function reduceRuleAntecedent(functorProvider, rule, factsArg) {
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
      let substitutedInstances = Resolutor
        .handleBuiltInFunctorArgumentInLiteral(functorProvider, literal);
      substitutedInstances.forEach((l) => {
        if (functorProvider.has(l.getId())) {
          literalThetas = literalThetas.concat(functorProvider.execute(l));
        }
        literalThetas = literalThetas.concat(Resolutor.findUnifications(l, facts));
      });

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
