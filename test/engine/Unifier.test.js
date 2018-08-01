const Unifier = lpsRequire('engine/Unifier');

const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Unifier', () => {
  describe('init', () => {
    let unifier = new Unifier();
    expect(unifier).to.be.not.null;
    expect(unifier).to.be.instanceof(Unifier);
  });

  describe('unifies()', () => {
    it('should return null for a thetaArg of null', () => {
      let value1 = new Value(5);
      let value2 = new Value(5);
      let theta = Unifier.unifies([[value1, value2]], null);
      expect(theta).to.be.null;
    });

    it('should unify two equal number values', () => {
      let value1 = new Value(5);
      let value2 = new Value(5);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;
      expect(Object.keys(theta)).to.be.empty;
    });

    it('should unify two equal number values', () => {
      let value1 = new Value(5);
      let value2 = new Value(7);
      let theta = Unifier.unifies([[value1, value2], [value1, value1]]);
      expect(theta).to.be.null;
    });

    it('should unify two equal number values with a substitution', () => {
      let value1 = new Value(5);
      let value2 = new Value(5);
      let existingTheta = { X: new Value(2) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.not.null;
      expect(theta).to.be.equal(existingTheta);
    });

    it('should not unify two unequal number values', () => {
      let value1 = new Value(2);
      let value2 = new Value(5);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.null;
    });

    it('should unify two equal string values', () => {
      let value1 = new Value('test');
      let value2 = new Value('test');
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;
      expect(Object.keys(theta)).to.be.empty;
    });

    it('should unify two equal string values with an unaffecting substitution', () => {
      let value1 = new Value('test');
      let value2 = new Value('test');
      let existingTheta = { X: new Value(2) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.not.null;
      expect(theta).to.be.equal(existingTheta);
    });

    it('should not unify two unequal string values', () => {
      let value1 = new Value('test1');
      let value2 = new Value('test2');
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.null;
    });

    it('should unify two exactly same functors', () => {
      let value1 = new Functor('test', [new Value(1), new Value(2)]);
      let value2 = new Functor('test', [new Value(1), new Value(2)]);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;
      expect(Object.keys(theta)).to.be.empty;
    });

    it('should unify two exactly same functors with an unaffecting substitution', () => {
      let value1 = new Functor('test', [new Value(1), new Value(2)]);
      let value2 = new Functor('test', [new Value(1), new Value(2)]);
      let existingTheta = { X: new Value(2) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.not.null;
      expect(theta).to.be.equal(existingTheta);
    });

    it('should unify two functors with a correct substitution', () => {
      let value1 = new Functor('test', [new Value(1), new Value(2)]);
      let value2 = new Functor('test', [new Value(1), new Variable('X')]);
      let existingTheta = { X: new Value(2) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.not.null;
      expect(theta).to.be.equal(existingTheta);
    });

    it('should unify two funtors and return the correct substitution', () => {
      let value1 = new Functor('test', [new Value(1), new Value(2)]);
      let value2 = new Functor('test', [new Value(1), new Variable('X')]);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;
      expect(Object.keys(theta)).to.be.contain('X');
      expect(theta.X).to.be.instanceof(Value);
      expect(theta.X.evaluate()).to.be.equal(2);
    });

    it('should unify two functors with nesting, and return correct substution', () => {
      let value1 = new Functor('test', [new Functor('g', [new Variable('Y')])]);
      let value2 = new Functor('test', [new Variable('X')]);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;
      expect(Object.keys(theta)).to.be.contain('X');
      expect(theta.X).to.be.instanceof(Functor);
      expect(theta.X.getId()).to.be.equal('g/1');
    });

    it('should unify two functors with multiple variable occurrences, and return correct substution', () => {
      let value1 = new Functor('f', [new Functor('g', [new Variable('X')]), new Variable('X')]);
      let value2 = new Functor('f', [new Variable('Y'), new Value('a')]);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;

      expect(Object.keys(theta)).to.be.contain('X');
      expect(theta.X).to.be.instanceof(Value);
      expect(theta.X.evaluate()).to.be.equal('a');

      expect(Object.keys(theta)).to.be.contain('Y');
      expect(theta.Y).to.be.instanceof(Functor);
      expect(theta.Y.getArguments().length).to.be.equal(1);
      expect(theta.Y.getArguments()[0]).to.be.instanceof(Value);
      expect(theta.Y.getArguments()[0].evaluate()).to.be.equal('a');
    });

    it('should not unify two funtors with an incorrect affecting substitution', () => {
      let value1 = new Functor('test', [new Value(1), new Value(2)]);
      let value2 = new Functor('test', [new Value(1), new Variable('X')]);
      let existingTheta = { X: new Value(5) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.null;
    });

    it('should not unify two functors of different names', () => {
      let value1 = new Functor('test1', [new Value(1), new Value(2)]);
      let value2 = new Functor('test2', [new Value(1), new Value(2)]);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.null;
    });

    it('should not unify two functors of different argument lengths', () => {
      let value1 = new Functor('test', [new Value(1), new Value(2), new Value(3)]);
      let value2 = new Functor('test', [new Value(1), new Value(2)]);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.null;
    });

    it('should not unify two functors of arguments', () => {
      let value1 = new Functor('test', [new Value(1), new Value(2)]);
      let value2 = new Functor('test', [new Value(1), new Value(5)]);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.null;
    });

    it('should unify a variable and a number value, and return the correct substitution', () => {
      let value1 = new Value(2);
      let value2 = new Variable('X');
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;
      expect(Object.keys(theta)).to.be.contain('X');
      expect(theta.X).to.be.instanceof(Value);
      expect(theta.X.evaluate()).to.be.equal(2);
    });

    it('should unify a number value and a variable, and return the correct substitution', () => {
      let value1 = new Variable('X');
      let value2 = new Value(2);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;
      expect(Object.keys(theta)).to.be.contain('X');
      expect(theta.X).to.be.instanceof(Value);
      expect(theta.X.evaluate()).to.be.equal(2);
    });

    it('should not unify a variable and a number value, given an alternative substitution', () => {
      let value1 = new Value(2);
      let value2 = new Variable('X');
      let existingTheta = { X: new Value(5) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.null;
    });

    it('should not unify a number value and a variable, given an alternative substitution', () => {
      let value1 = new Variable('X');
      let value2 = new Value(2);
      let existingTheta = { X: new Value(5) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.null;
    });

    it('should not unify a number value and a variable, given an alternative substitution', () => {
      let value1 = new Variable('X');
      let value2 = new Value(2);
      let existingTheta = { X: new Value(5) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.null;
    });

    it('should unify two variables of the same name', () => {
      let value1 = new Variable('X');
      let value2 = new Variable('X');
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;
    });

    it('should unify two variables of the different names without given any substitution', () => {
      let value1 = new Variable('X');
      let value2 = new Variable('Y');
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.not.null;
      expect(Object.keys(theta)).to.be.contain('X');
      expect(theta.X).to.be.instanceof(Variable);
      expect(theta.X.evaluate()).to.be.equal('Y');
    });

    it('should unify two variables of the different names given their substitution are equal', () => {
      let value1 = new Variable('X');
      let value2 = new Variable('Y');
      let existingTheta = { X: new Value(5), Y: new Value(5) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.not.null;
      expect(theta).to.be.equal(existingTheta);
    });

    it('should unify two variables of the different names given a substitution of one variable', () => {
      let value1 = new Variable('X');
      let value2 = new Variable('Y');
      let existingTheta = { X: new Value(5) };
      let theta = Unifier.unifies([[value1, value2]], existingTheta);
      expect(theta).to.be.not.null;

      expect(Object.keys(theta)).to.be.contain('X');
      expect(theta.X).to.be.instanceof(Value);
      expect(theta.X.evaluate()).to.be.equal(5);

      expect(Object.keys(theta)).to.be.contain('Y');
      expect(theta.Y).to.be.instanceof(Value);
      expect(theta.Y.evaluate()).to.be.equal(5);
    });

    it('should not unify a variable and a functor that contains that variable', () => {
      let value1 = new Variable('X');
      let value2 = new Functor('test', [new Variable('X')]);
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.null;
    });

    it('should not unify nonsense values in equality', () => {
      let value1 = 'a';
      let value2 = 'b';
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.null;
    });

    it('should not unify unexpected values in equality', () => {
      let value1 = { substitute: function () {} };
      let value2 = { substitute: function () {} };
      let theta = Unifier.unifies([[value1, value2]]);
      expect(theta).to.be.null;
    });

    it('should not unify incomplete equality', () => {
      let value1 = new Value(5);
      let theta = Unifier.unifies([[value1]]);
      expect(theta).to.be.null;
    });
  });
});
