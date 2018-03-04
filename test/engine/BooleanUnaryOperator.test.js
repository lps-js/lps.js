const BooleanUnaryOperator = require('../../src/engine/BooleanUnaryOperator');

const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('BooleanUnaryOperator', () => {
  describe('getOperand()', () => {
    it('should return the correct value', () => {
      let operator = new BooleanUnaryOperator('!', new Value(false));
      expect(operator.getOperand).to.be.a('function');
      expect(operator.getOperand()).to.be.instanceof(Value);
      expect(operator.getOperand().evaluate()).to.be.false;
    });
  });

  describe('evaluate()', () => {
    it('should return the value correctly for a negation operation', () => {
      let operator = new BooleanUnaryOperator('!', new Value(false));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.true;
    });

    it('should return the value correctly for a negation operation', () => {
      let operator = new BooleanUnaryOperator('!', new Value(true));
      expect(operator.evaluate).to.be.a('function');
      expect(operator.evaluate()).to.be.false;
    });

    it('should throw error for an invalid operator', () => {
      let operator = new BooleanUnaryOperator('/', new Value(false));
      expect(operator.evaluate).to.be.a('function');
      expect(() => { operator.evaluate(); }).to.throw();
    });
  });

  describe('getVariables()', () => {
    it('should return an empty array for an operation with no variables', () => {
      let operator = new BooleanUnaryOperator('!', new Value(true));
      expect(operator.getVariables).to.be.a('function');
      expect(operator.getVariables()).to.be.an('array');
      expect(operator.getVariables()).to.be.empty;
    });

    it('should return an array containing the correct variables for an operation with some variables', () => {
      let operator = new BooleanUnaryOperator('!', new Variable('X'));
      expect(operator.getVariables).to.be.a('function');
      expect(operator.getVariables()).to.be.an('array');
      expect(operator.getVariables()).to.contain('X');
    });
  });

  describe('isGround()', () => {
    it('should return an empty array for an operation with no variables', () => {
      let operator = new BooleanUnaryOperator('!', new Value(false));
      expect(operator.isGround).to.be.a('function');
      expect(operator.isGround()).to.be.true;
    });

    it('should return an array containing the correct variables for an operation with some variables', () => {
      let operator = new BooleanUnaryOperator('!', new Variable('X'));
      expect(operator.isGround).to.be.a('function');
      expect(operator.isGround()).to.be.false;
    });
  });

  describe('substitute()', () => {
    it('should return a clone for a empty substitution', () => {
      let operator = new BooleanUnaryOperator('!', new Value(true));
      let theta = {};
      let operatorP = operator.substitute(theta);
      expect(operatorP).to.be.instanceof(BooleanUnaryOperator);
      expect(operatorP).to.be.not.equal(operator);
      expect(operatorP.getOperand().evaluate()).to.be.equal(operator.getOperand().evaluate());
    });

    it('should return a clone for an unaffecting substitution', () => {
      let operator = new BooleanUnaryOperator('!', new Value(true));
      let theta = { Y: new Value('2') };
      let operatorP = operator.substitute(theta);
      expect(operatorP).to.be.instanceof(BooleanUnaryOperator);
      expect(operatorP).to.be.not.equal(operator);
      expect(operatorP.getOperand().evaluate()).to.be.equal(operator.getOperand().evaluate());
    });

    it('should return the correct expression for a substitution', () => {
      let operator = new BooleanUnaryOperator('!', new Variable('X'));
      let theta = { X: new Value(false) };
      let operatorP = operator.substitute(theta);
      expect(operatorP).to.be.instanceof(BooleanUnaryOperator);
      expect(operatorP).to.be.not.equal(operator);
      expect(operatorP.getOperand()).to.be.instanceof(Value);
      expect(operatorP.getOperand().evaluate()).to.be.equal(theta.X.evaluate());
    });
  });
});
