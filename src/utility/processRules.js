const LiteralTreeMap = require('../engine/LiteralTreeMap');
const Resolutor = require('../engine/Resolutor');
const GoalTree = require('../engine/GoalTree');
const BuiltInFunctorProvider = require('../engine/BuiltInFunctorProvider');

module.exports = function processRules(rules, goals, fluents, actions, events, factsArg) {
  let facts = factsArg;
  if (facts instanceof LiteralTreeMap) {
    facts = [facts];
  }

  let containsTimables = function(rule) {
    let bodyLiterals = rule.getBodyLiterals();
    let result = false;
    bodyLiterals.forEach((literal) => {
      if (fluents[literal.getId()] || actions[literal.getId()] || events[literal.getId()]) {
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
      // preserve a rule if it has timeable in its antecedent
      newRules.push(rule);
    }
    goals.push(new GoalTree(rule.getBodyLiterals(), rule.getHeadLiterals()));
  });
  return newRules;
};
