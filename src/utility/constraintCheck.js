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
  program.getClauses()
    .forEach((clause) => {
      if (!result || !clause.isConstraint()) {
        return;
      }
      let expansionResult = [];
      let literals = clause.getBodyLiterals();
      let queryResult = program.query(literals);

      if (queryResult.length > 0) {
        result = false;
      }
    });
  return result;
};
