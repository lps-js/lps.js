const Clause = lpsRequire('engine/Clause');
const hasExpiredTimable = lpsRequire('utility/hasExpiredTimable');
const GoalTree = lpsRequire('engine/GoalTree');
const Functor = lpsRequire('engine/Functor');
const Timable = lpsRequire('engine/Timable');
const List = lpsRequire('engine/List');
const Resolutor = lpsRequire('engine/Resolutor');

module.exports = function processRules(program, goals, currentTime) {
  let rules = program.getRules();

  let containsTimables = function containsTimables(rule) {
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

  let newRules = [];
  rules.forEach((rule) => {
    if (rule.getBodyLiteralsCount() === 0) {
      goals.push(new GoalTree(program, rule.getHeadLiterals()));
      return;
    }
    if (containsTimables(rule)) {
      // preserve a rule if it has timeable in its antecedent
      newRules.push(rule);
    }
    let resolutions = Resolutor.reduceRuleAntecedent(program, rule, currentTime);
    let consequentLiterals = rule.getHeadLiterals();
    resolutions.forEach((pair) => {
      if (pair.unresolved.length === rule.getBodyLiteralsCount()) {
        return;
      }
      let substitutedConsequentLiterals = consequentLiterals
        .map(l => l.substitute(pair.theta));
      if (pair.unresolved.length === 0) {
        goals.push(new GoalTree(program, substitutedConsequentLiterals));
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
  return newRules;
};
