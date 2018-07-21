const Clause = require('../engine/Clause');
const Value = require('../engine/Value');
const GoalTree = require('../engine/GoalTree');
const Resolutor = require('../engine/Resolutor');

module.exports = function processRules(program, goals, currentTime) {
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
      // remember partially resolved antecedent
      // TODO: need to check if any timable conjunct of the antecedent has expired
      let body = pair.unresolved.map(l => l.substitute(pair.theta));
      let acceptNewRule = true;

      // check if any conjunct has expired
      body.forEach((conjunct) => {
        if (!program.isTimable(conjunct)) {
          return;
        }

        let conjunctArgs = conjunct.getArguments();
        if (program.isFluent(conjunct)) {
          let timeArg = conjunctArgs[conjunctArgs.length - 1];
          if (timeArg instanceof Value && timeArg.evaluate() <= currentTime) {
            acceptNewRule = false;
            return
          }
        } else {
          let startTimeArg = conjunctArgs[conjunctArgs.length - 2];
          if (startTimeArg instanceof Value && startTimeArg.evaluate() <= currentTime) {
            acceptNewRule = false;
            return
          }
          let endTimeArg = conjunctArgs[conjunctArgs.length - 1];
          if (endTimeArg instanceof Value && endTimeArg.evaluate() <= currentTime) {
            acceptNewRule = false;
            return
          }
        }
      });

      // reject if any antecedent conjunct has expired
      if (acceptNewRule) {
        newRules.push(new Clause(substitutedConsequentLiterals, body));
      }
    });
  });
  return newRules;
};
