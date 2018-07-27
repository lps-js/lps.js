module.exports = function constraintCheck(program) {
  let result = true;
  program.getClauses()
    .forEach((clause) => {
      if (!result || !clause.isConstraint()) {
        return;
      }

      let literals = clause.getBodyLiterals();
      let queryResult = program.query(literals);

      if (queryResult.length > 0) {
        result = false;
      }
    });
  return result;
};
