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
      console.log(clause.resolve(new Functor('test2', [new Value(5)])).toString());
    });

    it('should resolve for a single variable correctly', () => {
      let head = [new Functor('test1', [new Variable('X'), new Variable('Y')])];
      let body = [new Functor('test2', [new Variable('X')])];
      let clause = new Clause(head, body);
      console.log(clause.resolve(new Functor('test2', [new Value(5)])).toString());
    });
  });
});
