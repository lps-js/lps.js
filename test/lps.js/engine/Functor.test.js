/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Functor', () => {
  describe('constructor', () => {
    it('should initialise the Functor correctly', () => {
      let functorArgs = [new Variable('X'), new Value(5)];
      let functor = new Functor('add', functorArgs);
      expect(functor.getId).to.be.a('function');

      expect(functor.getId()).to.be.equals('add/2');

      expect(functor.getArguments).to.be.a('function');
      expect(functor.getArgumentCount).to.be.a('function');

      expect(functor.getArguments()).to.be.an('array');
      expect(functor.getArguments()).contains(functorArgs[0]);
      expect(functor.getArguments()).contains(functorArgs[1]);
      expect(functor.getArguments().length).to.be.equal(2);

      expect(functor.getArgumentCount()).to.be.equal(2);
    });

    it('should initialise the Functor without args correctly', () => {
      let functor = new Functor('add');
      expect(functor.getId).to.be.a('function');
      expect(functor.getId()).to.be.equals('add/0');
      expect(functor.getArguments).to.be.a('function');

      expect(functor.getArguments()).to.be.an('array');
      expect(functor.getArguments().length).to.be.equals(0);
    });
  });

  describe('getId()', () => {
    it('should return the functor ID correctly', () => {
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      expect(functor.getId).to.be.a('function');

      expect(functor.getId()).to.be.equal('add/2');
    });
  });

  describe('evaluate()', () => {
    it('should return the functor string representation', () => {
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      expect(functor.evaluate).to.be.a('function');

      expect(functor.evaluate()).to.be.equal(functor.toString());
    });
  });

  describe('getGoal()', () => {
    it('should return the functor goal as itself', () => {
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      expect(functor.getGoal).to.be.a('function');

      expect(functor.getGoal()).to.be.equal(functor);
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

  describe('isGround()', () => {
    it('should return true for no variables', () => {
      let functor = new Functor('add', [new Value(2), new Value(5)]);
      expect(functor.isGround).to.be.a('function');

      expect(functor.isGround()).to.be.true;
    });

    it('should return false for some variables', () => {
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      expect(functor.isGround).to.be.a('function');

      expect(functor.isGround()).to.be.false;
    });

    describe('toString()', () => {
      it('should return correct string representation', () => {
        let functor = new Functor('add', [new Value(2), new Value(5)]);
        expect(functor.toString).to.be.a('function');

        expect(functor.toString()).to.be.equal('add(2, 5)');
      });

      it('should return correct string representation for argument of array', () => {
        let functor = new Functor('add', [new List([new Value(2), new Value(5)])]);
        expect(functor.toString).to.be.a('function');

        expect(functor.toString()).to.be.equal('add([2, 5])');
      });
    });
  });

  describe('substitute()', () => {
    it('should return a copy of itself if there\'s no substitution', () => {
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      expect(functor.substitute).to.be.a('function');

      let theta = {};
      let substitutedFunctor = functor.substitute(theta);
      expect(substitutedFunctor).to.be.instanceof(Functor);
      // ID of the functor should not change
      expect(substitutedFunctor.getId()).to.be.equals(functor.getId());
    });

    it('should return a copy of itself with substitution', () => {
      let functor = new Functor('add', [new Variable('X'), new Value(5)]);
      expect(functor.substitute).to.be.a('function');

      let theta = { X: new Value(2) };
      let substitutedFunctor = functor.substitute(theta);
      expect(substitutedFunctor).to.be.instanceof(Functor);
      // ID of the functor should not change
      expect(substitutedFunctor.getId()).to.be.equals(functor.getId());
      // if we substituted variable X, we should not get any variable
      expect(substitutedFunctor.getVariables().length).to.be.equals(0);

      expect(substitutedFunctor.getArguments()[0].evaluate()).to.be.equals(2);
      expect(substitutedFunctor.getArguments()[1].evaluate()).to.be.equals(5);
    });
  });
});
