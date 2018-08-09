module.exports = function constraintCheck(program) {
  let result = true;
  let constraints = program.getConstraints();
  for (let i = 0; i < constraints.length; i += 1) {
    let constraint = constraints[i];
    let literals = constraint.getBodyLiterals();
    let queryResult = program.query(literals);

    if (queryResult.length > 0) {
      result = false;
      break;
    }
  }
  return result;
};
