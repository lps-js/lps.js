function Variable(name) {
  let _name = name;

  this.evaluate = function evaluate() {
    // throw error because not instantiated
    return _name;
  };

  this.getVariables = function getVariables() {
    return [_name];
  };

  this.substitute = function substitute(theta) {
    if (name in theta) {
      // needs to be substituted
      return theta[name];
    }
    return new Variable(_name);
  };
}

module.exports = Variable;
