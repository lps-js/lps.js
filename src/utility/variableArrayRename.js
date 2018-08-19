/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Variable = lpsRequire('engine/Variable');

module.exports = function variableArrayRename(varArr, namePatternArg) {
  let namePattern = namePatternArg;
  if (!namePattern) {
    namePattern = '$_*';
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

  let newTheta = {};
  let hasChanges = false;
  do {
    newTheta = {};
    hasChanges = false;
    Object.keys(theta).forEach((varName) => {
      newTheta[varName] = theta[varName];
      if (theta[varName] instanceof Variable) {
        let varNameP = theta[varName].evaluate();
        if (theta[varNameP] !== undefined) {
          // do another round of renaming
          newTheta[varName] = new Variable(namePattern.replace('*', varNameP));
          hasChanges = true;
        }
      }
    });
    theta = newTheta;
  } while(hasChanges);
  return theta;
};
