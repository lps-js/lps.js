function Value(value) {
  let _value = value;

  this.evaluate = function evaluate() {
    return _value;
  };

  this.isGround = function isGround() {
    return true;
  };

  this.getVariables = function getVariables() {
    return [];
  };

  this.substitute = function substitute() {
    return new Value(_value);
  };
}

module.exports = Value;
