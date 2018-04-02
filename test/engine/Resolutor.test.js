const Resolutor = require('../../src/engine/Resolutor');
const Clause = require('../../src/engine/Clause');
const Functor = require('../../src/engine/Functor');
const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Resolutor', () => {
  describe('resolve', () => {
    it('should resolve for a single variable correctly', () => {
      let head = [new Functor('test1', [new Variable('X')])];
      let body = [new Functor('test2', [new Variable('X')])];
      let clause = new Clause(head, body);

      let resolution = Resolutor.resolve(clause, new Functor('test2', [new Value(5)]));
      let resClause = resolution.clause;
      expect(resClause).to.be.instanceof(Clause);
      expect(resClause.getVariables()).to.be.empty;
      expect(resClause.getHeadLiterals().length).to.be.equal(1);

      let headFunctor = resClause.getHeadLiterals()[0];
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

      let resolution = Resolutor.resolve(clause, new Functor('test2', [new Value(5)]));
      let resClause = resolution.clause
      expect(resClause).to.be.instanceof(Clause);
      expect(resClause.getVariables().length).to.be.equal(1);
      expect(resClause.getHeadLiterals().length).to.be.equal(1);

      let headFunctor = resClause.getHeadLiterals()[0];
      expect(headFunctor).to.be.instanceof(Functor);
      expect(headFunctor.getId()).to.be.equal('test1/2');
      expect(headFunctor.getVariables().length).to.be.equal(1);
      expect(headFunctor.getVariables()[0]).to.be.equal('Y');
      expect(headFunctor.getArguments().length).to.be.equal(2);
      expect(headFunctor.getArguments()[0].evaluate()).to.be.equal(5);
      expect(headFunctor.getArguments()[1]).to.be.instanceof(Variable);
    });
  });

  describe('query', () => {
    it('should return the correct resolution', () => {
      let fact = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [new Functor('test2', [new Variable('X')])]
      );
      let program = [fact, clause];
      let query = new Functor('test2', [new Variable('T')])
      let result = Resolutor.query(program, null, query, []);
      expect(result).to.be.not.null;
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.instanceof(Object);
      expect(result[0].theta['T']).to.be.instanceof(Value);
      expect(result[0].theta['T'].evaluate()).to.be.equal(5);
    });

    it('should return the correct resolution (alternate program ordering: fact after clause)', () => {
      let fact = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [new Functor('test2', [new Variable('X')])]
      );
      let program = [clause, fact];
      let query = new Functor('test2', [new Variable('T')])
      let result = Resolutor.query(program, null, query, []);
      expect(result).to.be.not.null;
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.instanceof(Object);
      expect(result[0].theta['T']).to.be.instanceof(Value);
      expect(result[0].theta['T'].evaluate()).to.be.equal(5);
    });

    it('should return the correct resolution for clause with multiple body', () => {
      let fact = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      let fact2 = new Clause(
        [new Functor('alpha', [new Value(5)])],
        []
      );
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [
          new Functor('test2', [new Variable('X')]),
          new Functor('alpha', [new Variable('X')])
        ]
      );
      let program = [fact, clause];
      let query = new Functor('test2', [new Variable('T')])
      let result = Resolutor.query(program, null, query, []);
      expect(result).to.be.not.null;
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.instanceof(Object);
      expect(result[0].theta['T']).to.be.instanceof(Value);
      expect(result[0].theta['T'].evaluate()).to.be.equal(5);
    });

    it('should return no resolution for clause with multiple body but no facts', () => {
      let fact2 = new Clause(
        [new Functor('alpha', [new Value(5)])],
        []
      );
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [
          new Functor('test2', [new Variable('X')]),
          new Functor('alpha', [new Variable('X')])
        ]
      );
      let program = [clause];
      let query = new Functor('test2', [new Variable('T')])
      let result = Resolutor.query(program, null, query, []);
      expect(result).to.be.not.null;
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.length(0);
    });

    it('should return multiple correct resolution', () => {
      let fact1 = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      let fact2 = new Clause(
        [new Functor('test', [new Value(3)])],
        []
      );
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [new Functor('test2', [new Variable('X')])]
      );
      let program = [fact1, fact2, clause];
      let query = new Functor('test2', [new Variable('T')])
      let result = Resolutor.query(program, null, query, []);
      expect(result).to.be.not.null;
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.length(2);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.instanceof(Object);
      expect(result[0].theta['T']).to.be.instanceof(Value);
      expect(result[0].theta['T'].evaluate()).to.be.equal(5);
      expect(result[1]).to.have.property('theta')
      expect(result[1].theta['T']).to.be.instanceof(Value);
      expect(result[1].theta['T'].evaluate()).to.be.equal(3);
    });

    it('should return true for multiple correct resolution', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [new Functor('test2', [new Variable('X')])]
      );
      let program = [clause];
      let query = new Functor('test2', [new Variable('T')])
      let result = Resolutor.query(program, null, query, []);
      expect(result).to.be.not.null;
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.length(0);
    });

    it('should return true for correct action resolution', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [new Functor('test2', [new Variable('X')])]
      );
      let program = [clause];
      let query = new Functor('test2', [new Variable('T')]);
      let result = Resolutor.query(program, null, query, ['test/1']);
      expect(result).to.be.not.null;
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.length(1);

      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.instanceof(Object);
      expect(result[0].theta['T']).to.be.instanceof(Variable);
      expect(result[0].theta['T'].evaluate()).to.be.equal('X');

      expect(result[0]).to.have.property('actions');
      expect(result[0].actions).to.be.instanceof(Array);
      expect(result[0].actions).to.be.length(1);
      expect(result[0].actions[0].action).to.be.equal('test/1');
      expect(result[0].actions[0].arguments).to.be.instanceof(Array);
      expect(result[0].actions[0].arguments).to.be.length(1);
      expect(result[0].actions[0].arguments[0]).to.be.instanceof(Variable);
      expect(result[0].actions[0].arguments[0].evaluate()).to.be.equal('X');
    });

    it('should return true for correct action resolution using ground query', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [new Functor('test2', [new Variable('X')])]
      );
      let program = [clause];
      let query = new Functor('test2', [new Value(5)]);
      let result = Resolutor.query(program, null, query, ['test/1']);
      expect(result).to.be.not.null;
      expect(result).to.be.instanceof(Array);
      expect(result).to.have.length(1);

      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.instanceof(Object);
      expect(result[0].theta['X']).to.be.instanceof(Value);
      expect(result[0].theta['X'].evaluate()).to.be.equal(5);

      expect(result[0]).to.have.property('actions');
      expect(result[0].actions).to.be.instanceof(Array);
      expect(result[0].actions).to.be.length(1);
      expect(result[0].actions[0].action).to.be.equal('test/1');
      expect(result[0].actions[0].arguments).to.be.instanceof(Array);
      expect(result[0].actions[0].arguments).to.be.length(1);
      expect(result[0].actions[0].arguments[0]).to.be.instanceof(Value);
      expect(result[0].actions[0].arguments[0].evaluate()).to.be.equal(5);
    });
  });
});
