function Value(value) {
  let _value = value;

  this.evaluate = function evaluate() {
    return _value;
  };

  this.getVariables = function getVariables() {
    return [];
  };
}

module.exports = Value;
