const BuiltInFunctorProvider = require('../engine/BuiltInFunctorProvider');
const Clause = require('../engine/Clause');
const LiteralTreeMap = require('../engine/LiteralTreeMap');
const GoalTree = require('../engine/GoalTree');
const Resolutor = require('../engine/Resolutor');

module.exports = function processRules(rules, goals, fluents, actions, events, factsArg) {
  let facts = factsArg;
  if (facts instanceof LiteralTreeMap) {
    facts = [facts];
  }

  let builtInFunctorProvider = new BuiltInFunctorProvider((literal) => {
    return Resolutor.findUnifications(literal, facts);
  });

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
    if (rule.getBodyLiteralsCount() === 0) {
      goals.push(new GoalTree(rule.getHeadLiterals(), builtInFunctorProvider));
      return;
    }
    let resolutions = Resolutor.reduceRuleAntecedent(builtInFunctorProvider, rule, facts);
    let consequentLiterals = rule.getHeadLiterals();
    resolutions.forEach((pair) => {
      if (pair.unresolved.length === rule.getBodyLiteralsCount()) {
        return;
      }
      let substitutedConsequentLiterals = consequentLiterals.map(l =>  l.substitute(pair.theta));
      if (pair.unresolved.length === 0) {
        goals.push(new GoalTree(substitutedConsequentLiterals, builtInFunctorProvider));
        return;
      }
      newRules.push(new Clause(substitutedConsequentLiterals, pair.unresolved.map(l => l.substitute(pair.theta))));
    });
  });
  return newRules;
};
