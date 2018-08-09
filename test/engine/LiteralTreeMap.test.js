const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('LiteralTreeMap', () => {
  describe('add', () => {
    it('should add a literal to the set correctly', () => {
      let treeMap = new LiteralTreeMap();
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      treeMap.add(functor);
      expect(treeMap.size()).to.be.equal(1);
      expect(treeMap.contains(functor)).to.be.not.false;
    });

    it('should add a literal with nested functor to the set correctly', () => {
      let treeMap = new LiteralTreeMap();
      let nestedFunctor = new Functor('times', [new Variable('X'), new Value(2)]);
      let functor = new Functor('add', [nestedFunctor, new Value(5)]);
      treeMap.add(functor);
      expect(treeMap.size()).to.be.equal(1);
      expect(treeMap.contains(functor)).to.be.not.false;
      expect(treeMap.contains(nestedFunctor)).to.be.false;
    });

    it('should add two similar literals to the set correctly', () => {
      let treeMap = new LiteralTreeMap();
      let functor1 = new Functor('add', [new Variable('X'), new Value(5)]);
      let functor2 = new Functor('add', [new Variable('Y'), new Value(3)]);
      treeMap.add(functor1);
      treeMap.add(functor2);

      expect(treeMap.size()).to.be.equal(2);
      expect(treeMap.contains(functor1)).to.be.not.false;
      expect(treeMap.contains(functor2)).to.be.not.false;
    });
  });

  describe('toArray', () => {
    it('should return correct array representation', () => {
      let treeMap = new LiteralTreeMap();
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      treeMap.add(functor);
      expect(treeMap.size()).to.be.equal(1);
      let result = treeMap.toArray();
      expect(result).to.be.an('array');
      expect(result).to.be.length(1);
      expect(result).to.contain(functor);
    });
  });

  describe('unifies', () => {
    it('should return the correct unification for a literal itself', () => {
      let treeMap = new LiteralTreeMap();
      let functor = new Functor('neighbours', [new Value('a'), new Value('b')]);
      treeMap.add(functor);

      let result = treeMap.unifies(functor);
      expect(result).to.be.an('array');
      expect(result).to.be.length(1);

      expect(result[0]).to.have.property('theta');
      expect(Object.keys(result[0].theta)).to.be.empty;
      expect(result[0]).to.have.property('leaf');
      expect(result[0].leaf).to.be.equal(functor);
    });

    it('should return the correct unification for a non-existent unmatching literal', () => {
      let treeMap = new LiteralTreeMap();
      let functor = new Functor('neighbours', [new Value('a'), new Value('b')]);
      treeMap.add(functor);

      let query = new Functor('neighbour', [new Variable('Y')]);
      let result = treeMap.unifies(query);

      expect(result).to.be.an('array');
      expect(result).to.be.length(0);
    });

    it('should return the correct unification for a variablised literal version', () => {
      let treeMap = new LiteralTreeMap();
      let functor = new Functor('neighbours', [new Value('a'), new Value('b')]);
      treeMap.add(functor);

      let query = new Functor('neighbours', [new Variable('X'), new Variable('Y')]);
      let result = treeMap.unifies(query);

      expect(result).to.be.an('array');
      expect(result).to.be.length(1);

      expect(result[0]).to.have.property('theta');
      expect(Object.keys(result[0].theta)).to.be.length(2);

      expect(result[0].theta).to.have.property('X');
      expect(result[0].theta.X).to.be.instanceof(Value);
      expect(result[0].theta.X.evaluate()).to.be.equal('a');

      expect(result[0].theta).to.have.property('Y');
      expect(result[0].theta.Y).to.be.instanceof(Value);
      expect(result[0].theta.Y.evaluate()).to.be.equal('b');

      expect(result[0]).to.have.property('leaf');
      expect(result[0].leaf).to.be.equal(functor);
    });

    it('should return the correct unification for a variablised unmatching literal', () => {
      let treeMap = new LiteralTreeMap();
      let functor = new Functor('neighbours', [new Value('a'), new Value('b')]);
      treeMap.add(functor);

      let query = new Functor('neighbours', [new Variable('X'), new Variable('X')]);
      let result = treeMap.unifies(query);

      expect(result).to.be.an('array');
      expect(result).to.be.length(0);
    });

    it('should return the correct unification for a nested literal', () => {
      let treeMap = new LiteralTreeMap();
      let args = [
        new Functor('min', [new Value('5'), new Value('6')]),
        new Value('b')
      ];
      let functor = new Functor('neighbours', args);
      treeMap.add(functor);

      let query = new Functor('neighbours', [new Variable('X'), new Variable('Y')]);
      let result = treeMap.unifies(query);

      expect(result).to.be.an('array');
      expect(result).to.be.length(1);

      expect(result[0]).to.have.property('theta');
      expect(Object.keys(result[0].theta)).to.be.length(2);

      expect(result[0].theta).to.have.property('X');
      expect(result[0].theta.X).to.be.instanceof(Functor);
      expect(result[0].theta.X).to.be.equal(args[0]);

      expect(result[0].theta).to.have.property('Y');
      expect(result[0].theta.Y).to.be.instanceof(Value);
      expect(result[0].theta.Y.evaluate()).to.be.equal('b');

      expect(result[0]).to.have.property('leaf');
      expect(result[0].leaf).to.be.equal(functor);
    });

    it('should return the correct unification for a nested literal', () => {
      let treeMap = new LiteralTreeMap();
      let args = [
        new Functor('min', [new Value('5'), new Value('6')]),
        new Value('b')
      ];
      let functor = new Functor('neighbours', args);
      treeMap.add(functor);

      let query = new Functor('neighbours', [new Functor('min', [new Variable('Z'), new Variable('X')]), new Variable('Y')]);
      let result = treeMap.unifies(query);

      expect(result).to.be.an('array');
      expect(result).to.be.length(1);

      expect(result[0]).to.have.property('theta');
      expect(Object.keys(result[0].theta)).to.be.length(3);

      expect(result[0].theta).to.have.property('X');
      expect(result[0].theta.X).to.be.instanceof(Value);
      expect(result[0].theta.X.evaluate()).to.be.equal('6');

      expect(result[0].theta).to.have.property('Y');
      expect(result[0].theta.Y).to.be.instanceof(Value);
      expect(result[0].theta.Y.evaluate()).to.be.equal('b');

      expect(result[0].theta).to.have.property('Z');
      expect(result[0].theta.Z).to.be.instanceof(Value);
      expect(result[0].theta.Z.evaluate()).to.be.equal('5');

      expect(result[0]).to.have.property('leaf');
      expect(result[0].leaf).to.be.equal(functor);
    });

    it('should return the correct unification for a nested literal', () => {
      let treeMap = new LiteralTreeMap();
      let args = [
        new Variable('X'),
        new Variable('X')
      ];
      let functor = new Functor('self', args);
      treeMap.add(functor);

      let query = new Functor('self', [new Variable('X'), new Variable('Y')]);
      let result = treeMap.unifies(query);

      expect(result).to.be.an('array');
      expect(result).to.be.length(1);

      expect(result[0]).to.have.property('theta');
      expect(Object.keys(result[0].theta)).to.be.length(2);

      expect(result[0].theta).to.have.property('X');
      expect(result[0].theta.X).to.be.instanceof(Variable);
      expect(result[0].theta.X.evaluate()).to.be.equal('X');

      expect(result[0].theta).to.have.property('Y');
      expect(result[0].theta.Y).to.be.instanceof(Variable);
      expect(result[0].theta.Y.evaluate()).to.be.equal('X');

      expect(result[0]).to.have.property('leaf');
      expect(result[0].leaf).to.be.equal(functor);
    });

    it('should return the correct unification for a nested literal', () => {
      let treeMap = new LiteralTreeMap();
      let args = [
        new Variable('X'),
        new Value('b')
      ];
      let functor = new Functor('neighbours', args);
      treeMap.add(functor);

      let functor2 = new Functor('min', [new Value('5'), new Value('6')]);
      let query = new Functor('neighbours', [functor2, new Variable('Y')]);
      let result = treeMap.unifies(query);

      expect(result).to.be.an('array');
      expect(result).to.be.length(1);

      expect(result[0]).to.have.property('theta');
      expect(Object.keys(result[0].theta)).to.be.length(2);

      expect(result[0].theta).to.have.property('X');
      expect(result[0].theta.X).to.be.instanceof(Functor);
      expect(result[0].theta.X).to.be.equal(functor2);

      expect(result[0].theta).to.have.property('Y');
      expect(result[0].theta.Y).to.be.instanceof(Value);
      expect(result[0].theta.Y.evaluate()).to.be.equal('b');

      expect(result[0]).to.have.property('leaf');
      expect(result[0].leaf).to.be.equal(functor);
    });

    it('should return the correct unification for a repeated variables in query literal', () => {
      let treeMap = new LiteralTreeMap();
      let args = [
        new Value('a'),
        new Value('a')
      ];
      let functor = new Functor('neighbours', args);
      treeMap.add(functor);

      let query = new Functor('neighbours', [new Variable('X'), new Variable('X')]);
      let result = treeMap.unifies(query);

      expect(result).to.be.an('array');
      expect(result).to.be.length(1);

      expect(result[0]).to.have.property('theta');
      expect(Object.keys(result[0].theta)).to.be.length(1);

      expect(result[0].theta).to.have.property('X');
      expect(result[0].theta.X).to.be.instanceof(Value);
      expect(result[0].theta.X.evaluate()).to.be.equal('a');

      expect(result[0]).to.have.property('leaf');
      expect(result[0].leaf).to.be.equal(functor);
    });

    it('should return the correct unification for a list in fact.', () => {
      let treeMap = new LiteralTreeMap();
      let list = new List([]);
      let args = [
        list
      ];
      let functor = new Functor('func', args);
      treeMap.add(functor);

      let query = new Functor('func', [new Variable('A')]);
      let result = treeMap.unifies(query);

      expect(result).to.be.an('array');
      expect(result).to.be.length(1);

      expect(result[0]).to.have.property('theta');
      expect(Object.keys(result[0].theta)).to.be.length(1);

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(List);
      expect(result[0].theta.A).to.be.equal(list);

      expect(result[0]).to.have.property('leaf');
      expect(result[0].leaf).to.be.equal(functor);
    });
  })
});
