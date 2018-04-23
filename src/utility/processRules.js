const LiteralTreeMap = require('../engine/LiteralTreeMap');
const Resolutor = require('../engine/Resolutor');
const GoalTree = require('../engine/GoalTree');
const BuiltInFunctorProvider = require('../engine/BuiltInFunctorProvider');

module.exports = function processRules(rules, goals, clauses, fluents, actions, events, factsArg) {
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
      // console.log('preserving rule ' + rule);
      // preserve a rule if it has timeable in its antecedent
      newRules.push(rule);
    }
    goals.push(new GoalTree(rule.getBodyLiterals(), rule.getHeadLiterals()));
    // let resolutions = Resolutor.reduceRuleAntecedent(builtInFunctorProvider, rule, clauses, facts);
    // let consequentLiterals = rule.getHeadLiterals();
    // resolutions.forEach((pair) => {
    //   if (pair.unresolved.length === rule.getBodyLiteralsCount()) {
    //     return;
    //   }
    //   let substitutedConsequentLiterals = consequentLiterals.map(l =>  l.substitute(pair.theta));
    //   if (pair.unresolved.length === 0) {
    //     console.log('adding: ' + substitutedConsequentLiterals);
    //
    //     goals.push(substitutedConsequentLiterals);
    //     return;
    //   }
    //   newRules.push(new Clause(substitutedConsequentLiterals, pair.unresolved.map(l => l.substitute(pair.theta))));
    // });
  });
  return newRules;
};
