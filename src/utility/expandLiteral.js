const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Variable = lpsRequire('engine/Variable');
const variableArrayRename = lpsRequire('utility/variableArrayRename');

module.exports = function expandLiteral(literalArg, program, usedVariables) {
  let literal = literalArg;

  let literalTreeMap = new LiteralTreeMap();
  literalTreeMap.add(literal);
  let renameTheta = variableArrayRename(usedVariables);

  let result = [];
  program.getClauses().forEach((clause) => {
    if (clause.isConstraint()) {
      return;
    }

    // assuming horn clauses only
    let headLiterals = clause.getHeadLiterals();
    let headLiteral = headLiterals[0].substitute(renameTheta);
    let unifications = literalTreeMap.unifies(headLiteral);
    if (unifications.length === 0) {
      return;
    }

    unifications.forEach((pair) => {
      let theta = pair.theta;
      let outputTheta = {};

      // restore output variables
      Object.keys(theta)
        .forEach((varName) => {
          if (theta[varName] instanceof Variable) {
            // output variable
            outputTheta[theta[varName].evaluate()] = new Variable(varName);
            delete theta[varName];
          }
        });
      let resultingClause = clause.getBodyLiterals()
        .map(l => l.substitute(theta).substitute(renameTheta));

      result.push({
        clause: resultingClause,
        theta: outputTheta,
        internalTheta: theta
      });
    });
  });
  return result;
};
