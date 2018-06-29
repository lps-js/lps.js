const Clause = require('../engine/Clause');
const LiteralTreeMap = require('../engine/LiteralTreeMap');
const GoalTree = require('../engine/GoalTree');
const Resolutor = require('../engine/Resolutor');

module.exports = function processRules(program, goals) {
  let rules = program.getRules();

  let facts = [
    program.getFacts(),
    program.getState(),
    program.getExecutedActions()
  ];

  let containsTimables = function containsTimables(rule) {
    let bodyLiterals = rule.getBodyLiterals();
    let result = false;
    bodyLiterals.forEach((literal) => {
      if (program.isTimable(literal)) {
        result = true;
      }
    });
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
      let body = pair.unresolved.map(l => l.substitute(pair.theta));
      newRules.push(new Clause(substitutedConsequentLiterals, body));
    });
  });
  return newRules;
};
