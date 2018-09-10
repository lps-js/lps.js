/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Clause = lpsRequire('engine/Clause');
const hasExpiredTimable = lpsRequire('utility/hasExpiredTimable');
const GoalTree = lpsRequire('engine/GoalTree');
const Functor = lpsRequire('engine/Functor');
const Timable = lpsRequire('engine/Timable');
const Resolutor = lpsRequire('engine/Resolutor');

const containsTimables = function containsTimables(rule, currentTime) {
  let conjuncts = rule.getBodyLiterals();
  for (let i = 0; i < conjuncts.length; i += 1) {
    let conjunct = conjuncts[i];
    while (conjunct instanceof Functor
        && conjunct.getId() === '!/1') {
      conjunct = conjunct.getArguments()[0];
    }
    if (!(conjunct instanceof Timable)) {
      continue;
    }
    return !conjunct.hasExpired(currentTime);
  }
  return false;
};

module.exports = function processRules(engine, program, currentTime, profiler) {
  let rules = program.getRules();
  let newGoals = [];

  let state = [
    program.getFacts(),
    program.getState(),
    program.getExecutedActions()
  ];

  const fireRule = function fireRule(consequent) {
    let newGoalsTemp = [];
    newGoals.forEach((goal) => {
      if (!goal.isSameRootConjunction(consequent)) {
        // discard older goal
        newGoalsTemp.push(goal);
      }
    });
    newGoals = newGoalsTemp;
    newGoals.push(new GoalTree(engine, program, consequent, currentTime));
  };

  let newRules = [];
  rules.forEach((rule) => {
    if (rule.getBodyLiteralsCount() === 0) {
      fireRule(rule.getHeadLiterals());
      return;
    }
    let isRulePreserved = false;
    if (containsTimables(rule, currentTime)) {
      isRulePreserved = true;
      // preserve a rule if it has timeable in its antecedent
      newRules.push(rule);
    }
    let resolutions = Resolutor.reduceRuleAntecedent(engine, program, state, rule, currentTime);
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
      let body = pair.unresolved;
      let acceptNewRule = !hasExpiredTimable(body, currentTime);

      // reject if any antecedent conjunct has expired
      if (acceptNewRule) {
        let newRule = new Clause(substitutedConsequentLiterals, body);
        newRules.push(newRule);
        profiler.increment('lastCycleNumNewRules');
      }
    });
    if (!isRulePreserved) {
      profiler.increment('lastCycleNumDiscardedRules');
    }
  });
  profiler.set('numRules', newRules.length);
  program.setRules(newRules);
  profiler.increaseBy('lastCycleNumFiredRules', newGoals.length);
  return newGoals;
};
