/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Clause = lpsRequire('engine/Clause');
const hasExpiredTimable = lpsRequire('utility/hasExpiredTimable');
const GoalTree = lpsRequire('engine/GoalTree');
const Functor = lpsRequire('engine/Functor');
const Timable = lpsRequire('engine/Timable');
const Resolutor = lpsRequire('engine/Resolutor');

module.exports = function processRules(engine, program, goals, currentTime) {
  let rules = program.getRules();
  let newGoals = [];

  const containsTimables = function containsTimables(rule) {
    let firstConjunct = rule.getBodyLiterals()[0];
    while (firstConjunct instanceof Functor
        && firstConjunct.getId() === '!/1') {
      firstConjunct = firstConjunct.getArguments()[0];
    }
    if (program.isTimable(firstConjunct)) {
      return true;
    }
    if (!(firstConjunct instanceof Timable)) {
      return false;
    }
    return firstConjunct.isAnytime();
  };

  const fireRule = function fireRule(consequent) {
    for (let i = 0; i < goals.length; i += 1) {
      if (goals[i].isSameRootConjunction(consequent)) {
        // a same root conjunction exists, don't refire
        return;
      }
    }
    for (let i = 0; i < newGoals.length; i += 1) {
      if (newGoals[i].isSameRootConjunction(consequent)) {
        // a same root conjunction exists, don't refire
        return;
      }
    }
    newGoals.push(new GoalTree(engine, program, consequent));
  };

  let newRules = [];
  rules.forEach((rule) => {
    if (rule.getBodyLiteralsCount() === 0) {
      fireRule(rule.getHeadLiterals());
      return;
    }
    if (containsTimables(rule)) {
      // preserve a rule if it has timeable in its antecedent
      newRules.push(rule);
    }
    let resolutions = Resolutor.reduceRuleAntecedent(engine, program, rule, currentTime);
    let consequentLiterals = rule.getHeadLiterals();
    resolutions.forEach((pair) => {
      if (pair.unresolved.length === rule.getBodyLiteralsCount()) {
        return;
      }
      let substitutedConsequentLiterals = consequentLiterals
        .map(l => l.substitute(pair.theta));
      if (pair.unresolved.length === 0) {
        fireRule(substitutedConsequentLiterals);
        return;
      }

      // remember partially resolved antecedent
      let body = pair.unresolved.map(l => l.substitute(pair.theta));
      let acceptNewRule = !hasExpiredTimable(body, currentTime);

      // reject if any antecedent conjunct has expired
      if (acceptNewRule) {
        let newRule = new Clause(substitutedConsequentLiterals, body);
        newRules.push(newRule);
      }
    });
  });
  program.updateRules(newRules);
  return newGoals;
};
