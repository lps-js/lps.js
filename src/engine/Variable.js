function Variable(name) {
  let _name = name;

  this.evaluate = function evaluate() {
    // throw error because not instantiated
    return _name;
  };

  this.getVariables = function getVariables() {
    return [_name];
  };
}

module.exports = Variable;
