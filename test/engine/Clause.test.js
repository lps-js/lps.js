const Clause = require('../../src/engine/Clause');
const Functor = require('../../src/engine/Functor');
const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Clause', () => {
  describe('constructor', () => {
    it('should initialise a fact Clause correctly', () => {
      let clause = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );

      expect(clause.getVariables).to.be.a('function');
      expect(clause.getHeadLiterals).to.be.a('function');
      expect(clause.getBodyLiterals).to.be.a('function');
      expect(clause.isFact).to.be.a('function');
      expect(clause.isGround).to.be.a('function');
      expect(clause.substitute).to.be.a('function');

      expect(clause.isFact()).to.be.true;
      expect(clause.isGround()).to.be.true;
      expect(clause.getHeadLiterals()).to.be.instanceof(Array);
      expect(clause.getBodyLiterals()).to.be.instanceof(Array);
      expect(clause.getHeadLiterals()).to.be.length(1);
      expect(clause.getBodyLiterals()).to.be.length(0);

      expect(clause.getHeadLiterals()[0]).to.be.instanceof(Functor);
      expect(clause.getHeadLiterals()[0].getId()).to.be.equal('test/1');
    });
  });

  describe('isGround', () => {
    it('should return true for ground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      expect(clause.isGround()).to.be.true;
    });

    it('should return true for unground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        []
      );
      expect(clause.isGround()).to.be.false;
    });

    it('should return true for ground query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Value(5)])]
      );
      expect(clause.isGround()).to.be.true;
    });

    it('should return true for unground query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Variable('X')])]
      );
      expect(clause.isGround()).to.be.false;
    });
  });

  describe('toString', () => {
    it('should return correct representation for ground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      expect(clause.toString()).to.be.equal('test(5).');
    });

    it('should return correct representation for unground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        []
      );
      expect(clause.toString()).to.be.equal('test(X).');
    });

    it('should return correct representation for ground query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Value(5)])]
      );
      expect(clause.toString()).to.be.equal('<- test(5).');
    });

    it('should return correct representation for unground query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Variable('X')])]
      );
      expect(clause.toString()).to.be.equal('<- test(X).');
    });

    it('should return correct representation for ground clause', () => {
      let clause = new Clause(
        [new Functor('test2', [new Value(5)])],
        [new Functor('test', [new Value(5)])]
      );
      expect(clause.toString()).to.be.equal('test2(5) <- test(5).');
    });

    it('should return correct representation for unground clause', () => {
      let clause = new Clause(
        [new Functor('test2', [new Variable('X')])],
        [new Functor('test', [new Variable('X')])]
      );
      expect(clause.toString()).to.be.equal('test2(X) <- test(X).');
    });
  });
});
