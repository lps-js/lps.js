const Functor = lpsRequire('engine/Functor');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');
const variableArrayRename = lpsRequire('utility/variableArrayRename');
const compactTheta = lpsRequire('utility/compactTheta');
const sortTimables = lpsRequire('utility/sortTimables');
const resolveTimableThetaTiming = lpsRequire('utility/resolveTimableThetaTiming');

let Resolutor = {};

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
        let replaceCount = 0;
        executionResult.forEach((instance) => {
          if (instance.replacement === undefined) {
            return;
          }
          replaceCount += 1;
          handleLiteralArg(argsSoFar.concat([instance.replacement]), idx + 1);
        });

        if (replaceCount === 0) {
          handleLiteralArg(argsSoFar.concat(arg), idx + 1);
        }
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
    let functorProvider = program.getFunctorProvider();
    let facts = [
      program.getFacts(),
      program.getState(),
      program.getExecutedActions()
    ];

    if (otherFacts !== undefined) {
      if (otherFacts instanceof LiteralTreeMap) {
        facts.push(otherFacts);
      } else if (otherFacts instanceof Array) {
        facts = facts.concat(otherFacts);
      }
    }

    let query = queryArg;
    if (query instanceof Functor) {
      query = [query];
    }

    let recursiveResolution = function (remainingLiterals, thetaSoFar) {
      let result = [];
      if (remainingLiterals.length === 0) {
        result.push({
          theta: thetaSoFar
        });
        return result;
      }

      let literal = remainingLiterals[0]
        .substitute(thetaSoFar);

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
      let variableSetFunc = (v) => {
        variablesInUse[v] = true;
      };
      for (let i = 0; i < remainingLiterals.length; i += 1) {
        let otherLiteral = remainingLiterals[i];
        otherLiteral.getVariables()
          .forEach(variableSetFunc);
      }

      variablesInUse = Object.keys(variablesInUse);
      let renameTheta = variableArrayRename(variablesInUse);
      let literalMap = new LiteralTreeMap();
      literalMap.add(literal);
      program
        .getDefinitions(literalMap, variablesInUse)
        .forEach((tuple) => {
          let bodyLiterals = tuple.definition;
          let headLiteral = tuple.headLiteral;
          let unificationTheta = tuple.theta;

          // perform resolution on the subgoal
          let subResult = recursiveResolution(bodyLiterals, {});
          subResult.forEach((r) => {
            let updatedHeadLiteral = headLiteral
              .substitute(r.theta)
              .substitute(renameTheta);
            let unifications = literalMap.unifies(updatedHeadLiteral);
            if (unifications.length === 0) {
              return;
            }
            unifications.forEach((tuple) => {
              let theta = tuple.theta;
              literalThetas.push({ theta: theta });
            });
          });
        });

      if (literalThetas.length === 0) {
        return [];
      }

      let newRemainingLiterals = remainingLiterals.slice(1, remainingLiterals.length);

      literalThetas.forEach((t) => {
        let compactedTheta = compactTheta(thetaSoFar, t.theta);
        let subResult = recursiveResolution(newRemainingLiterals, compactedTheta);
        result = result.concat(subResult);
      });
      return result;
    };

    let result = recursiveResolution(query, {}, []);
    let variablesToOutput = {};

    query.forEach((literal) => {
      literal.getVariables().forEach((varName) => {
        variablesToOutput[varName] = true;
      });
    });

    result.forEach((tupleArg) => {
      let tuple = tupleArg;
      Object.keys(tuple.theta).forEach((key) => {
        if (variablesToOutput[key] === undefined) {
          delete tuple.theta[key];
        }
      });
    });
    return result;
  };

Resolutor.reduceRuleAntecedent =
  function reduceRuleAntecedent(program, rule, forTime) {
    let facts = [
      program.getFacts(),
      program.getState(),
      program.getExecutedActions()
    ];
    let functorProvider = program.getFunctorProvider();

    let recursiveResolution = function (result, remainingLiterals, theta, laterAntecedent) {
      if (remainingLiterals.length === 0) {
        result.push({
          theta: theta,
          unresolved: laterAntecedent
        });
        return;
      }
      let conjunct = remainingLiterals[0]
        .substitute(theta);
      let literal = conjunct
        .getGoal();
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
        if (!program.isTimable(literal)) {
          return;
        }
        result.push({
          theta: theta,
          unresolved: remainingLiterals.concat(laterAntecedent)
        });
        return;
      }

      resolveTimableThetaTiming(conjunct, theta, forTime);
      literalThetas.forEach((t) => {
        let updatedTheta = compactTheta(theta, t.theta);
        recursiveResolution(
          result,
          remainingLiterals.slice(1, remainingLiterals.length),
          updatedTheta,
          laterAntecedent
        );
      });
    };

    let literals = rule.getBodyLiterals();
    let pair = sortTimables(literals, forTime);
    let thetaSet = [];
    recursiveResolution(thetaSet, pair[0], {}, pair[1]);
    return thetaSet;
  };

module.exports = Resolutor;
