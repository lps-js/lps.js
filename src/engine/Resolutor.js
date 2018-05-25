const BuiltInFunctorProvider = require('./BuiltInFunctorProvider');
const Functor = require('./Functor');
const LiteralTreeMap = require('./LiteralTreeMap');
const compactTheta = require('../utility/compactTheta');

function Resolutor() {}

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
