const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Variable = lpsRequire('engine/Variable');
const variableArrayRename = lpsRequire('utility/variableArrayRename');

module.exports = function expandLiteral(literalArg, program, usedVariables) {
  let literal = literalArg;

  let literalTreeMap = new LiteralTreeMap();
  literalTreeMap.add(literal);
  let renameTheta = variableArrayRename(usedVariables);

  let result = [];
  program
    .getDefinitions(literalTreeMap, renameTheta)
    .forEach((tuple) => {
      let bodyLiterals = tuple.definition;
      let headLiteral = tuple.headLiteral;
      let theta = tuple.theta;
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

      result.push({
        clause: bodyLiterals,
        theta: theta
      });
    });
  return result;
};
