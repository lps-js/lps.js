const Functor = require('../../src/engine/Functor');
const LiteralTreeMap = require('../../src/engine/LiteralTreeMap');
const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('LiteralTreeMap', () => {
  describe('add', () => {
    it('should add a literal to the set correctly', () => {
      let treeSet = new LiteralTreeMap();
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      treeSet.add(functor);
      expect(treeSet.size()).to.be.equal(1);
      expect(treeSet.contains(functor)).to.be.not.false;
    });

    it('should add a literal with nested functor to the set correctly', () => {
      let treeSet = new LiteralTreeMap();
      let nestedFunctor = new Functor('times', [new Variable('X'), new Value(2)]);
      let functor = new Functor('add', [nestedFunctor, new Value(5)]);
      treeSet.add(functor);
      expect(treeSet.size()).to.be.equal(1);
      expect(treeSet.contains(functor)).to.be.not.false;
      expect(treeSet.contains(nestedFunctor)).to.be.false;
    });

    it('should add two similar literals to the set correctly', () => {
      let treeSet = new LiteralTreeMap();
      let functor1 = new Functor('add', [new Variable('X'), new Value(5)]);
      let functor2 = new Functor('add', [new Variable('Y'), new Value(3)]);
      treeSet.add(functor1);
      treeSet.add(functor2);

      expect(treeSet.size()).to.be.equal(2);
      expect(treeSet.contains(functor1)).to.be.not.false;
      expect(treeSet.contains(functor2)).to.be.not.false;
    });
  });

  describe('toArray', () => {
    it('should return correct array representation', () => {
      let treeSet = new LiteralTreeMap();
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      treeSet.add(functor);
      expect(treeSet.size()).to.be.equal(1);
      let result = treeSet.toArray();
      expect(result).to.be.an('array');
      expect(result).to.be.length(1);
      expect(result).to.contain(functor);
    });
  });
});
