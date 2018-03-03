function BinaryOperator(operator, operand1, operand2) {
  let _operator = operator;
  let _operand1 = operand1;
  let _operand2 = operand2;

  this.getOperand1 = function getOperand1() {
    return _operand1;
  };

  this.getOperand2 = function getOperand2() {
    return _operand2;
  };

  this.evaluate = function evaluate() {
    let operandVal1 = _operand1.evaluate();
    let operandVal2 = _operand2.evaluate();
    switch (_operator) {
      case '+':
        return operandVal1 + operandVal2;
      case '-':
        return operandVal1 - operandVal2;
      case '/':
        return operandVal1 / operandVal2;
      case '*':
        return operandVal1 * operandVal2;
      case '**':
        return Math.pow(operandVal1, operandVal2);
      default:
        throw new Error('Invalid operator');
    }
  };

  this.getVariables = function getVariables() {
    let hash = {};

    let registerVariable = (argVar) => {
      hash[argVar] = true;
    };
    _operand1.getVariables().forEach(registerVariable);
    _operand2.getVariables().forEach(registerVariable);

    return Object.keys(hash);
  };

  this.isGround = function isGround() {
    return _operand1.isGround() && _operand2.isGround();
  };

  this.substitute = function substitute(theta) {
    return new BinaryOperator(
      _operator,
      _operand1.substitute(theta),
      _operand2.substitute(theta)
    );
  };
}

module.exports = BinaryOperator;
