const Clause = lpsRequire('engine/Clause');
const hasExpiredTimable = lpsRequire('utility/hasExpiredTimable');
const GoalTree = lpsRequire('engine/GoalTree');
const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const Resolutor = lpsRequire('engine/Resolutor');

module.exports = function processRules(program, goals, currentTime) {
  let rules = program.getRules();

  let facts = [
    program.getFacts(),
    program.getState(),
    program.getExecutedActions()
  ];

  let containsTimables = function containsTimables(rule) {
    let bodyLiterals = rule.getBodyLiterals();
    let recursiveTimableCheck = (set) => {
      for (let i = 0; i < set.length; i += 1) {
        if (program.isTimable(set[i])) {
          return true;
        }
        if (set[i] instanceof Functor) {
          let subResult = recursiveTimableCheck(set[i].getArguments());
          if (subResult) {
            return true;
          }
        } else if (set[i] instanceof List) {
          let subResult = recursiveTimableCheck(set[i].flatten());
          if (subResult) {
            return true;
          }
        }
      }
      return false;
    };
    return recursiveTimableCheck([bodyLiterals[0]]);
  };

  let newRules = [];
  rules.forEach((rule) => {
    if (containsTimables(rule)) {
      // preserve a rule if it has timeable in its antecedent
      newRules.push(rule);
    }
    if (rule.getBodyLiteralsCount() === 0) {
      goals.push(new GoalTree(program, rule.getHeadLiterals()));
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
        goals.push(new GoalTree(program, substitutedConsequentLiterals));
        return;
      }

      // remember partially resolved antecedent
      let body = pair.unresolved.map(l => l.substitute(pair.theta));
      let acceptNewRule = !hasExpiredTimable(body, program, currentTime);

      // reject if any antecedent conjunct has expired
      if (acceptNewRule) {
        let newRule = new Clause(substitutedConsequentLiterals, body);
        newRules.push(newRule);
      }
    });
  });
  return newRules;
};
