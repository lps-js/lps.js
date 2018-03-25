const Clause = require('../../src/engine/Clause');
const Functor = require('../../src/engine/Functor');
const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Clause', () => {
  describe('resolve', () => {
    it('should resolve for a single variable correctly', () => {
      let head = [new Functor('test1', [new Variable('X')])];
      let body = [new Functor('test2', [new Variable('X')])];
      let clause = new Clause(head, body);

      let resolution = clause.resolve(new Functor('test2', [new Value(5)]));
      expect(resolution).to.be.instanceof(Clause);
      expect(resolution.getVariables()).to.be.empty;
      expect(resolution.getHeadLiterals().length).to.be.equal(1);

      let headFunctor = resolution.getHeadLiterals()[0];
      expect(headFunctor).to.be.instanceof(Functor);
      expect(headFunctor.getId()).to.be.equal('test1/1');
      expect(headFunctor.getVariables()).to.be.empty;
      expect(headFunctor.getArguments().length).to.be.equal(1);
      expect(headFunctor.getArguments()[0].evaluate()).to.be.equal(5);
    });

    it('should resolve for a single variable correctly', () => {
      let head = [new Functor('test1', [new Variable('X'), new Variable('Y')])];
      let body = [new Functor('test2', [new Variable('X')])];
      let clause = new Clause(head, body);

      let resolution = clause.resolve(new Functor('test2', [new Value(5)]));
      expect(resolution).to.be.instanceof(Clause);
      expect(resolution.getVariables().length).to.be.equal(1);
      expect(resolution.getHeadLiterals().length).to.be.equal(1);

      let headFunctor = resolution.getHeadLiterals()[0];
      expect(headFunctor).to.be.instanceof(Functor);
      expect(headFunctor.getId()).to.be.equal('test1/2');
      expect(headFunctor.getVariables().length).to.be.equal(1);
      expect(headFunctor.getVariables()[0]).to.be.equal('Y');
      expect(headFunctor.getArguments().length).to.be.equal(2);
      expect(headFunctor.getArguments()[0].evaluate()).to.be.equal(5);
      expect(headFunctor.getArguments()[1]).to.be.instanceof(Variable);
    });
  });
});
