const BooleanBinaryOperator = require('../../src/engine/BooleanBinaryOperator');

const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('BooleanBinaryOperator', () => {
  describe('getOperand1()', () => {
    it('should return the correct value', () => {
      let operator = new BooleanBinaryOperator('>', new Value(5), new Value(2));
      expect(operator.getOperand1).to.be.a('function');
      expect(operator.getOperand1()).to.be.instanceof(Value);
      expect(operator.getOperand1().evaluate()).to.be.equal(5);
    });
  });

  describe('getOperand2()', () => {
    it('should return the correct value', () => {
      let operator = new BooleanBinaryOperator('>', new Value(5), new Value(2));
      expect(operator.getOperand2).to.be.a('function');
      expect(operator.getOperand2()).to.be.instanceof(Value);
      expect(operator.getOperand2().evaluate()).to.be.equal(2);
    });
  });

  describe('evaluate()', () => {
    it('should return the value correctly for a greater than operation', () => {
      let operator = new BooleanBinaryOperator('>', new Value(5), new Value(2));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.true;
    });

    it('should return the value correctly for a greater than operation', () => {
      let operator = new BooleanBinaryOperator('>', new Value(2), new Value(5));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.false;
    });

    it('should return the value correctly for a less than operation', () => {
      let operator = new BooleanBinaryOperator('<', new Value(2), new Value(5));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.true;
    });

    it('should return the value correctly for a less than operation', () => {
      let operator = new BooleanBinaryOperator('<', new Value(5), new Value(2));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.false;
    });

    it('should return the value correctly for a greater than or equal operation', () => {
      let operator = new BooleanBinaryOperator('>=', new Value(5), new Value(2));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.true;
    });

    it('should return the value correctly for a greater than or equal operation', () => {
      let operator = new BooleanBinaryOperator('>=', new Value(5), new Value(5));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.true;
    });

    it('should return the value correctly for a less than or equal operation', () => {
      let operator = new BooleanBinaryOperator('<=', new Value(2), new Value(5));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.true;
    });

    it('should return the value correctly for a less than or equal operation', () => {
      let operator = new BooleanBinaryOperator('<=', new Value(5), new Value(5));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.true;
    });

    it('should return the value correctly for an equal operation', () => {
      let operator = new BooleanBinaryOperator('==', new Value(5), new Value(5));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.true;
    });

    it('should return the value correctly for an equal operation', () => {
      let operator = new BooleanBinaryOperator('==', new Value(2), new Value(5));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.false;
    });

    it('should return the value correctly for an inequality operation', () => {
      let operator = new BooleanBinaryOperator('!=', new Value(5), new Value(2));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.true;
    });

    it('should return the value correctly for an inequality operation', () => {
      let operator = new BooleanBinaryOperator('!=', new Value(2), new Value(2));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.false;
    });

    it('should throw error for an invalid operator', () => {
      let operator = new BooleanBinaryOperator('/=', new Value(6), new Value(2));
      expect(operator.evaluate).to.be.a('function');
      expect(() => { operator.evaluate(); }).to.throw();
    });
  });

  describe('getVariables()', () => {
    it('should return an empty array for an operation with no variables', () => {
      let operator = new BooleanBinaryOperator('>', new Value(5), new Value(2));
      expect(operator.getVariables).to.be.a('function');
      expect(operator.getVariables()).to.be.an('array');
      expect(operator.getVariables()).to.be.empty;
    });

    it('should return an array containing the correct variables for an operation with some variables', () => {
      let operator = new BooleanBinaryOperator('>', new Variable('X'), new Value(2));
      expect(operator.getVariables).to.be.a('function');
      expect(operator.getVariables()).to.be.an('array');
      expect(operator.getVariables()).to.contain('X');
    });

    it('should return an array containing the correct variables for an operation with some variables in alternative ordering', () => {
      let operator = new BooleanBinaryOperator('>', new Value(2), new Variable('X'));
      expect(operator.getVariables).to.be.a('function');
      expect(operator.getVariables()).to.be.an('array');
      expect(operator.getVariables()).to.contain('X');
    });
  });

  describe('isGround()', () => {
    it('should return an empty array for an operation with no variables', () => {
      let operator = new BooleanBinaryOperator('>', new Value(5), new Value(2));
      expect(operator.isGround).to.be.a('function');
      expect(operator.isGround()).to.be.true;
    });

    it('should return an array containing the correct variables for an operation with some variables', () => {
      let operator = new BooleanBinaryOperator('>', new Variable('X'), new Value(2));
      expect(operator.isGround).to.be.a('function');
      expect(operator.isGround()).to.be.false;
    });
  });

  describe('substitute()', () => {
    it('should return a clone for a empty substitution', () => {
      let operator = new BooleanBinaryOperator('>', new Value(5), new Value(2));
      let theta = {};
      let operatorP = operator.substitute(theta);
      expect(operatorP).to.be.instanceof(BooleanBinaryOperator);
      expect(operatorP).to.be.not.equal(operator);
      expect(operatorP.getOperand1().evaluate()).to.be.equal(operator.getOperand1().evaluate());
      expect(operatorP.getOperand2().evaluate()).to.be.equal(operator.getOperand2().evaluate());
    });

    it('should return a clone for an unaffecting substitution', () => {
      let operator = new BooleanBinaryOperator('>', new Value(5), new Value(2));
      let theta = { Y: new Value('2') };
      let operatorP = operator.substitute(theta);
      expect(operatorP).to.be.instanceof(BooleanBinaryOperator);
      expect(operatorP).to.be.not.equal(operator);
      expect(operatorP.getOperand1().evaluate()).to.be.equal(operator.getOperand1().evaluate());
      expect(operatorP.getOperand2().evaluate()).to.be.equal(operator.getOperand2().evaluate());
    });

    it('should return the correct expression for a substitution', () => {
      let operator = new BooleanBinaryOperator('>', new Variable('X'), new Value(2));
      let theta = { X: new Value('5') };
      let operatorP = operator.substitute(theta);
      expect(operatorP).to.be.instanceof(BooleanBinaryOperator);
      expect(operatorP).to.be.not.equal(operator);
      expect(operatorP.getOperand1()).to.be.instanceof(Value);
      expect(operatorP.getOperand1().evaluate()).to.be.equal(theta.X.evaluate());
      expect(operatorP.getOperand2().evaluate()).to.be.equal(operator.getOperand2().evaluate());
    });
  });
});
