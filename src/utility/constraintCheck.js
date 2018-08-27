/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

module.exports = function constraintCheck(engine, program) {
  let constraints = program.getConstraints();
  for (let i = 0; i < constraints.length; i += 1) {
    let constraint = constraints[i];
    let literals = constraint.getBodyLiterals();
    let queryResult = engine.query(literals);
    if (queryResult.length > 0) {
      return false;
    }
  }
  return true;
};
