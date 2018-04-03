const Functor = require('../../src/engine/Functor');
const LiteralTreeSet = require('../../src/engine/LiteralTreeSet');
const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('LiteralTreeSet', () => {
  describe('add', () => {
    it('should add a literal to the set correctly', () => {
      let treeSet = new LiteralTreeSet();
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      treeSet.add(functor);
      expect(treeSet.size()).to.be.equal(1);
      expect(treeSet.isInSet(functor)).to.be.not.false;
    });

    it('should add a literal with nested functor to the set correctly', () => {
      let treeSet = new LiteralTreeSet();
      let nestedFunctor = new Functor('times', [new Variable('X'), new Value(2)]);
      let functor = new Functor('add', [nestedFunctor, new Value(5)]);
      treeSet.add(functor);
      expect(treeSet.size()).to.be.equal(1);
      expect(treeSet.isInSet(functor)).to.be.not.false;
      expect(treeSet.isInSet(nestedFunctor)).to.be.false;
    });

    it('should add two similar literals to the set correctly', () => {
      let treeSet = new LiteralTreeSet();
      let functor1 = new Functor('add', [new Variable('X'), new Value(5)]);
      let functor2 = new Functor('add', [new Variable('Y'), new Value(3)]);
      treeSet.add(functor1);
      treeSet.add(functor2);

      expect(treeSet.size()).to.be.equal(2);
      expect(treeSet.isInSet(functor1)).to.be.not.false;
      expect(treeSet.isInSet(functor2)).to.be.not.false;
    });
  });
});
