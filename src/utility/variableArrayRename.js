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
  varArr.forEach((varName) => {
    theta[varName] = new Variable(namePattern.replace('*', varname));
  })
  return theta;
};
