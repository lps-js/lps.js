const Clause = require('../engine/Clause');
const hasExpiredTimable = require('./hasExpiredTimable');
const GoalTree = require('../engine/GoalTree');
const Resolutor = require('../engine/Resolutor');

module.exports = function processRules(program, goals, updatedState, currentTime) {
  let rules = program.getRules();

  let facts = [
    program.getFacts(),
    program.getState(),
    program.getExecutedActions(),
    updatedState
  ];

  let containsTimables = function containsTimables(rule) {
    let bodyLiterals = rule.getBodyLiterals();
    let result = false;
    for (let i = 0; i < bodyLiterals.length; i += 1) {
      if (program.isTimable(bodyLiterals[i])) {
        result = true;
        break;
      }
    }
    return result;
  };

  let newRules = [];
  rules.forEach((rule) => {
    if (containsTimables(rule)) {
      // preserve a rule if it has timeable in its antecedent
      newRules.push(rule);
    }
    if (rule.getBodyLiteralsCount() === 0) {
      goals.push(new GoalTree(rule.getHeadLiterals()));
      return;
    }
    let resolutions = Resolutor.reduceRuleAntecedent(program.getFunctorProvider(), rule, facts);
    let consequentLiterals = rule.getHeadLiterals();
    resolutions.forEach((pair) => {
      if (pair.unresolved.length === rule.getBodyLiteralsCount()) {
        return;
      }
      let substitutedConsequentLiterals = consequentLiterals.map(l => l.substitute(pair.theta));
      if (pair.unresolved.length === 0) {
        goals.push(new GoalTree(substitutedConsequentLiterals));
        return;
      }

      // remember partially resolved antecedent
      let body = pair.unresolved.map(l => l.substitute(pair.theta));
      let acceptNewRule = !hasExpiredTimable(body, program, currentTime);

      // reject if any antecedent conjunct has expired
      if (acceptNewRule) {
        newRules.push(new Clause(substitutedConsequentLiterals, body));
      }
    });
  });
  return newRules;
};
