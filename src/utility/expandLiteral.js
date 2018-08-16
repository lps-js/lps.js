/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Variable = lpsRequire('engine/Variable');

module.exports = function expandLiteral(literalArg, program, renameTheta) {
  let literal = literalArg;

  let result = [];
  program
    .getDefinitions(literal, renameTheta)
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
