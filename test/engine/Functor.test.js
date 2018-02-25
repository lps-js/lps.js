const Functor = require('../../src/engine/Functor');
const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Functor', () => {

  describe('getVariables()', () => {
    it('should return variables in itself', () => {
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      expect(functor.getVariables).to.be.a('function');

      expect(functor.getVariables()).to.be.an('array');
      expect(functor.getVariables()).contains('X');
      expect(functor.getVariables().length).to.be.equals(1);
    });
  });

});
