const Variable = require('../engine/Variable');

module.exports = function variableArrayRename(varArr, namePatternArg) {
  let namePattern = namePatternArg;
  if (!namePattern) {
    namePattern = 'VX*';
  }
  if (typeof namePattern !== 'string') {
    throw new Error('name pattern for variable array renaming must be a string.');
  }
  // create the substitution
  let theta = {};
  varArr.forEach((variable) => {
    let varName = variable;
    if (variable instanceof Variable) {
      varName = variable.evaluate();
    }
    theta[varName] = new Variable(namePattern.replace('*', varName));
  });
  return theta;
};
