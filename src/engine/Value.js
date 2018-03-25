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

  this.toString = function toString() {
    let result = _value;
    if (typeof _value === 'string') {
      result = '"' + result.replace('"', '\\"') + '"';
    }
    return result;
  };
}

module.exports = Value;
