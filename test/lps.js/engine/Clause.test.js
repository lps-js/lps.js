/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Clause = lpsRequire('engine/Clause');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');

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
      expect(clause.isGround).to.be.a('function');
      expect(clause.substitute).to.be.a('function');

      expect(clause.isGround()).to.be.true;
      expect(clause.getHeadLiterals()).to.be.instanceof(Array);
      expect(clause.getBodyLiterals()).to.be.instanceof(Array);
      expect(clause.getHeadLiterals()).to.be.length(1);
      expect(clause.getBodyLiterals()).to.be.length(0);
      expect(clause.getHeadLiteralsCount()).to.be.equal(1);
      expect(clause.getBodyLiteralsCount()).to.be.equal(0);

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

  describe('substitute', () => {
    it('should return correct substitution for empty substitution in a ground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      let theta = {};
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for some substitution in a ground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      let theta = { X: new Value(3) };
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for empty substitution in a unground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        []
      );
      let theta = {};
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for some substitution in a unground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        []
      );
      let theta = { X: new Value(3) };
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal('test(3) <- true.');
    });

    it('should return same clause for some irrelevant substitution in a unground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        []
      );
      let theta = { T: new Value(3) };
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for empty substitution in a ground query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Value(5)])]
      );
      let theta = {};
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for some substitution in a ground query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Value(5)])]
      );
      let theta = { X: new Value(3) };
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for empty substitution in a unground query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Variable('X')])]
      );
      let theta = {};
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for some substitution in a unground query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Variable('X')])]
      );
      let theta = { X: new Value(3) };
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal('<- test(3).');
    });

    it('should return same clause for some irrelevant substitution in a unground query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Variable('X')])]
      );
      let theta = { T: new Value(3) };
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });


    it('should return correct substitution for empty substitution in a ground clause', () => {
      let clause = new Clause(
        [new Functor('test2', [new Value(5)])],
        [new Functor('test', [new Value(5)])]
      );
      let theta = {};
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for some substitution in a ground clause', () => {
      let clause = new Clause(
        [new Functor('test2', [new Value(5)])],
        [new Functor('test', [new Value(5)])]
      );
      let theta = { X: new Value(3) };
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for empty substitution in a unground clause', () => {
      let clause = new Clause(
        [new Functor('test2', [new Value(5)])],
        [new Functor('test', [new Value(5)])]
      );
      let theta = {};
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });

    it('should return correct substitution for some substitution in a unground clause', () => {
      let clause = new Clause(
        [new Functor('test2', [new Variable('X')])],
        [new Functor('test', [new Variable('X')])]
      );
      let theta = { X: new Value(3) };
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal('test2(3) <- test(3).');
    });

    it('should return same clause for some irrelevant substitution in a unground clause', () => {
      let clause = new Clause(
        [new Functor('test2', [new Variable('X')])],
        [new Functor('test', [new Variable('X')])]
      );
      let theta = { T: new Value(3) };
      let substitutedClause = clause.substitute(theta);
      expect(substitutedClause.toString()).to.be.equal(clause.toString());
    });
  });

  describe('getHeadLiteralsCount', () => {
    it('should return correct head literal count for fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      expect(clause.getHeadLiteralsCount()).to.be.equal(1);
    });

    it('should return correct head literal count for query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Value(5)])]
      );
      expect(clause.getHeadLiteralsCount()).to.be.equal(0);
    });

    it('should return correct head literal count for clause', () => {
      let clause = new Clause(
        [new Functor('test2', [new Value(5)])],
        [new Functor('test', [new Value(5)])]
      );
      expect(clause.getHeadLiteralsCount()).to.be.equal(1);
    });
  });

  describe('getBodyLiteralsCount', () => {
    it('should return correct head literal count for fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      expect(clause.getBodyLiteralsCount()).to.be.equal(0);
    });

    it('should return correct head literal count for query', () => {
      let clause = new Clause(
        [],
        [new Functor('test', [new Value(5)])]
      );
      expect(clause.getBodyLiteralsCount()).to.be.equal(1);
    });

    it('should return correct head literal count for clause', () => {
      let clause = new Clause(
        [new Functor('test2', [new Value(5)])],
        [new Functor('test', [new Value(5)])]
      );
      expect(clause.getBodyLiteralsCount()).to.be.equal(1);
    });
  });

  describe('toString', () => {
    it('should return correct representation for ground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Value(5)])],
        []
      );
      expect(clause.toString()).to.be.equal('test(5) <- true.');
    });

    it('should return correct representation for unground fact', () => {
      let clause = new Clause(
        [new Functor('test', [new Variable('X')])],
        []
      );
      expect(clause.toString()).to.be.equal('test(X) <- true.');
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

    it('should return correct representation for multiple head literals clause', () => {
      let clause = new Clause(
        [
          new Functor('test2', [new Variable('X')]),
          new Functor('test3', [new Variable('Y')])
        ],
        [new Functor('test', [new Variable('X')])]
      );
      expect(clause.toString()).to.be.equal('test2(X), test3(Y) <- test(X).');
    });

    it('should return correct representation for multiple body literals clause', () => {
      let clause = new Clause(
        [
          new Functor('test2', [new Variable('X')])
        ],
        [
          new Functor('test', [new Variable('X')]),
          new Functor('test3', [new Variable('Y')])
        ]
      );
      expect(clause.toString()).to.be.equal('test2(X) <- test(X), test3(Y).');
    });
  });
});
