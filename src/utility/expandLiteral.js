/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Variable = lpsRequire('engine/Variable');
const compactTheta = lpsRequire('utility/compactTheta');

module.exports = function expandLiteral(literalArg, program, renameTheta) {
  let literal = literalArg;

  let result = [];
  program
    .getDefinitions(literal)
    .forEach((tuple) => {
      let theta = {};
      Object.keys(tuple.internalTheta).forEach((v) => {
        let value = tuple.internalTheta[v];
        if (value instanceof Variable && renameTheta[value.evaluate()] !== undefined) {
          theta[renameTheta[value.evaluate()].evaluate()] = new Variable(v);
        } else if (value instanceof Variable) {
          theta[value.evaluate()] = new Variable(v);
        }
      });

      theta = compactTheta(tuple.internalTheta, theta);
      let bodyLiterals = tuple.definition.map(c => {
        return c.substitute(renameTheta).substitute(theta);
      });

      let updatedHead = tuple.headLiteral.substitute(renameTheta).substitute(theta);
      let headMap = new LiteralTreeMap();
      headMap.add(updatedHead);
      let unifications = headMap.unifies(literal);
      unifications.forEach((u) => {
        result.push({
          conjuncts: bodyLiterals.map(l => l.substitute(u.theta)),
          theta: u.theta
        });
      });
    });
  return result;
};
