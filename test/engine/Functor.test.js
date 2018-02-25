const Functor = require('../../src/engine/Functor');
const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Functor', () => {

  describe('constructor', () => {
    it('should initialise the Functor correctly', () => {
      let arguments = [new Variable('X'), new Value(5)];
      let functor = new Functor('add', arguments);
      expect(functor.getId).to.be.a('function');

      expect(functor.getId()).to.be.equals("add/2");

      expect(functor.getArguments).to.be.a('function');

      expect(functor.getArguments()).to.be.an('array');
      expect(functor.getArguments()).contains(arguments[0]);
      expect(functor.getArguments()).contains(arguments[1]);
      expect(functor.getArguments().length).to.be.equals(2);
    });
  });

  describe('getVariables()', () => {
    it('should return variables in itself', () => {
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      expect(functor.getVariables).to.be.a('function');

      expect(functor.getVariables()).to.be.an('array');
      expect(functor.getVariables()).contains('X');
      expect(functor.getVariables().length).to.be.equals(1);
    });
  });

  describe('substitute()', () => {
    it('should return a copy of itself if there\'s no substitution', () => {
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      expect(functor.substitute).to.be.a('function');

      let theta = {};
      expect(functor.substitute(theta)).to.be.instanceof(Functor);
      // ID of the functor should not change
      expect(functor.substitute(theta).getId()).to.be.equals(functor.getId());
    });
  });

});
