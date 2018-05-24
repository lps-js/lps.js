const Resolutor = require('../../src/engine/Resolutor');
const Clause = require('../../src/engine/Clause');
const LiteralTreeMap = require('../../src/engine/LiteralTreeMap');
const Functor = require('../../src/engine/Functor');
const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');
const BuiltInFunctorProvider = require('../../src/engine/BuiltInFunctorProvider');

const chai = require('chai');
const expect = chai.expect;

describe('Resolutor', () => {
  describe('newResolve', () => {
    it('should help to debug', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [new Functor('test2', [new Variable('X')])]
      );
      let facts = new LiteralTreeMap();
      facts.add(new Functor('test2', [new Value(5)]));
      facts.add(new Functor('test2', [new Value(3)]));

      let program = [clause];

      let resolutor = new Resolutor(facts);
      let newFacts = resolutor.resolve(program);
      expect(newFacts).to.be.instanceof(LiteralTreeMap);
      expect(newFacts.size()).to.be.equal(2);

      let array = newFacts.toArray();

      expect(array[0]).to.be.instanceof(Functor);
      expect(array[0].getId()).to.be.equal('test/1');
      expect(array[0].isGround()).to.be.true;

      expect(array[1]).to.be.instanceof(Functor);
      expect(array[1].getId()).to.be.equal('test/1');
      expect(array[1].isGround()).to.be.true;
    });

    it('should handle built-in functors', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        [
          new Functor('test2', [new Variable('X')]),
          new Functor('!', [new Functor('test3', [new Variable('X')])])
        ]
      );
      let facts = new LiteralTreeMap();
      facts.add(new Functor('test2', [new Value(5)]));
      facts.add(new Functor('test2', [new Value(3)]));

      let program = [clause];

      let resolutor = new Resolutor(facts);
      let newFacts = resolutor.resolve(program);
      expect(newFacts).to.be.instanceof(LiteralTreeMap);
      expect(newFacts.size()).to.be.equal(2);

      let array = newFacts.toArray();

      expect(array[0]).to.be.instanceof(Functor);
      expect(array[0].getId()).to.be.equal('test/1');
      expect(array[0].isGround()).to.be.true;

      expect(array[1]).to.be.instanceof(Functor);
      expect(array[1].getId()).to.be.equal('test/1');
      expect(array[1].isGround()).to.be.true;
    });

    it('should return null for constraints', () => {
      let clause = new Clause(
        [],
        [
          new Functor('test2', [new Variable('X')])
        ]
      );
      let facts = new LiteralTreeMap();
      facts.add(new Functor('test2', [new Value(5)]));
      facts.add(new Functor('test2', [new Value(3)]));

      let program = [clause];

      let resolutor = new Resolutor(facts);
      let newFacts = resolutor.resolve(program);

      expect(newFacts).to.be.equal(null);
    });

    it('should return null for constraints', () => {
      let clause1 = new Clause(
        [
          new Functor('test2', [new Variable('X')])
        ],
        [
          new Functor('test1', [new Variable('X')])
        ]
      );
      let clause2 = new Clause(
        [],
        [
          new Functor('test2', [new Variable('X')])
        ]
      );
      let facts = new LiteralTreeMap();
      facts.add(new Functor('test1', [new Value(5)]));
      facts.add(new Functor('test1', [new Value(3)]));

      let program = [clause1, clause2];

      let resolutor = new Resolutor(facts);
      let newFacts = resolutor.resolve(program);

      expect(newFacts).to.be.equal(null);
    });

    it('should return correct resolution for constraints', () => {
      let clause1 = new Clause(
        [
          new Functor('test2', [new Variable('X')])
        ],
        [
          new Functor('test1', [new Variable('X')])
        ]
      );
      let clause2 = new Clause(
        [],
        [
          new Functor('test2', [new Value(5)])
        ]
      );
      let facts = new LiteralTreeMap();
      facts.add(new Functor('test1', [new Value(5)]));
      facts.add(new Functor('test1', [new Value(3)]));

      let program = [clause1, clause2];

      let resolutor = new Resolutor(facts);
      let newFacts = resolutor.resolve(program);

      expect(newFacts).to.be.instanceof(LiteralTreeMap);
      expect(newFacts.size()).to.be.equal(1);

      let array = newFacts.toArray();

      expect(array[0]).to.be.instanceof(Functor);
      expect(array[0].getId()).to.be.equal('test2/1');
      expect(array[0].isGround()).to.be.true;
      expect(array[0].getArguments()[0]).to.be.instanceof(Value);
      expect(array[0].getArguments()[0].evaluate()).to.be.equal(3);
    });
  });

  describe('reduceRuleAntecedent', () => {
    it('should return the test result', () => {
      let rule = new Clause(
        [new Functor('deal_with_fire', [new Variable('T1'), new Variable('T2')])],
        [new Functor('fire', [new Variable('T1')])]
      );

      let facts = new LiteralTreeMap();
      facts.add(new Functor('fire', [new Value(1)]));
      let builtInFunctorProvider = new BuiltInFunctorProvider({}, (literal) => {
        return Resolutor.findUnifications(literal, facts);
      });

      let result = Resolutor.reduceRuleAntecedent(builtInFunctorProvider, rule, facts);
      console.log(result);
    });
  });
});
