const expandRuleAntecedent = require('./expandRuleAntecedent');
const Resolutor = require('../engine/Resolutor');
const Clause = require('../engine/Clause');

module.exports = function constraintCheck(program, builtInFunctorProvider, factsArg, newFacts) {
  let facts = factsArg;
  if (!(facts instanceof Array)) {
    facts = [facts];
  }
  if (newFacts instanceof Array) {
    facts = facts.concat(newFacts);
  } else if (newFacts !== undefined) {
    facts = facts.concat([newFacts]);
  }

  let result = true;
  program.forEach((clause) => {
    if (!result || !clause.isConstraint()) {
      return;
    }
    let expansionResult = [];
    let literals = clause.getBodyLiterals();
    expandRuleAntecedent(expansionResult, literals, [], program);
    expansionResult.forEach((r) => {
      if (!result) {
        return;
      }
      let clause = new Clause([], r.literalSet);
      let reductionResult = Resolutor.reduceRuleAntecedent(builtInFunctorProvider, clause, facts);
      reductionResult.forEach((tuple) => {
        if (tuple.unresolved.length === 0) {
          result = false;
        }
      });
    });
  });
  return result;
}
