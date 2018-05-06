const LiteralTreeMap = require('../engine/LiteralTreeMap');
const GoalTree = require('../engine/GoalTree');

module.exports = function processRules(rules, goals, fluents, actions, events, factsArg) {
  let facts = factsArg;
  if (facts instanceof LiteralTreeMap) {
    facts = [facts];
  }

  let containsTimables = function containsTimables(rule) {
    let bodyLiterals = rule.getBodyLiterals();
    let result = false;
    bodyLiterals.forEach((literal) => {
      if (fluents[literal.getId()] || actions[literal.getId()] || events[literal.getId()]) {
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
    goals.push(new GoalTree(rule.getBodyLiterals(), rule.getHeadLiterals()));
  });
  return newRules;
};
