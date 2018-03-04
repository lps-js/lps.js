function UnaryOperator(operator, operand) {
  let _operator = operator;
  let _operand = operand;

  this.getOperand = function getOperand() {
    return _operand;
  };

  this.evaluate = function evaluate() {
    let operandVal = _operand.evaluate();
    switch (_operator) {
      case '-':
        return -operandVal;
      default:
        throw new Error('Invalid unary operator');
    }
  };

  this.getVariables = function getVariables() {
    return _operand.getVariables();
  };

  this.isGround = function isGround() {
    return _operand.isGround();
  };

  this.substitute = function substitute(theta) {
    return new UnaryOperator(
      _operator,
      _operand.substitute(theta)
    );
  };
}

module.exports = UnaryOperator;
