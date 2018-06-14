const expandRuleAntecedent = require('./expandRuleAntecedent');
const Resolutor = require('../engine/Resolutor');
const Clause = require('../engine/Clause');

module.exports = function constraintCheck(program) {
  let facts = [
    program.getFacts(),
    program.getState(),
    program.getExecutedActions()
  ];

  let functorProvider = program.getFunctorProvider();

  let result = true;
  program.getClauses().forEach((clause) => {
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
      let newClause = new Clause([], r.literalSet);
      let reductionResult = Resolutor
        .reduceRuleAntecedent(functorProvider, newClause, facts);
      reductionResult.forEach((tuple) => {
        if (tuple.unresolved.length === 0) {
          result = false;
        }
      });
    });
  });
  return result;
};
