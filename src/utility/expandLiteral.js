const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Variable = lpsRequire('engine/Variable');

module.exports = function expandLiteral(literalArg, program, renameTheta) {
  let literal = literalArg;

  let literalTreeMap = new LiteralTreeMap();
  literalTreeMap.add(literal);

  let result = [];
  program
    .getDefinitions(literalTreeMap, renameTheta)
    .forEach((tuple) => {
      let bodyLiterals = tuple.definition;
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
