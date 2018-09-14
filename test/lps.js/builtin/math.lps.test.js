/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Engine = lpsRequire('engine/Engine');
const Program = lpsRequire('engine/Program');
const ProgramFactory = lpsRequire('parser/ProgramFactory');

const chai = require('chai');
const expect = chai.expect;

describe('math.lps', () => {
  let engine;

  before((done) => {
    let program = new Program();
    engine = new Engine(program);
    engine.load()
      .then(() => {
        done();
      });
  });

  describe('sin/2', () => {
    it('should return correct result for variable replacement', () => {
      let result = engine.query(ProgramFactory.literal('sin(60, A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(Math.sin(60));
    });

    it('should return correct result for matching output', () => {
      let result = engine.query(ProgramFactory.literal('sin(60, ' + Math.sin(60) + ')'));
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.have.be.empty;
    });

    it('should return empty array for non-match', () => {
      let result = engine.query(ProgramFactory.literal('sin(60, 2)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // sin/2

  describe('cos/2', () => {
    it('should return correct result for variable replacement', () => {
      let result = engine.query(ProgramFactory.literal('cos(60, A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(Math.cos(60));
    });

    it('should return correct result for matching output', () => {
      let result = engine.query(ProgramFactory.literal('cos(60, ' + Math.cos(60) + ')'));
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.have.be.empty;
    });

    it('should return empty array for non-match', () => {
      let result = engine.query(ProgramFactory.literal('cos(60, 2)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // cos/2

  describe('tan/2', () => {
    it('should return correct result for variable replacement', () => {
      let result = engine.query(ProgramFactory.literal('tan(60, A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(Math.tan(60));
    });

    it('should return correct result for matching output', () => {
      let result = engine.query(ProgramFactory.literal('tan(60, ' + Math.tan(60) + ')'));
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.have.be.empty;
    });

    it('should return empty array for non-match', () => {
      let result = engine.query(ProgramFactory.literal('tan(60, 2)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // tan/2

  describe('succ/2', () => {
    it('should return correct result for variable replacement 1', () => {
      let result = engine.query(ProgramFactory.literal('succ(5, A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(6);
    });

    it('should return correct result for variable replacement 2', () => {
      let result = engine.query(ProgramFactory.literal('succ(A, 6)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(5);
    });

    it('should return empty array for non-match', () => {
      let result = engine.query(ProgramFactory.literal('succ(2, 5)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should return empty array for out of domain parameters', () => {
      let result = engine.query(ProgramFactory.literal('succ(N, -5)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should return empty array for out of domain parameters', () => {
      let result = engine.query(ProgramFactory.literal('succ(-5, N)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // succ/2

  describe('between/3', () => {
    it('should return correct result for correct parameters', () => {
      let result = engine.query(ProgramFactory.literal('between(2, 6, 4)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.be.empty;
    });

    it('should return correct result for same values', () => {
      let result = engine.query(ProgramFactory.literal('between(2, 2, 2)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);

      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.empty;
    });

    it('should return correct result for high low values', () => {
      let result = engine.query(ProgramFactory.literal('between(2, 2, X)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('X');
      expect(result[0].theta.X).to.have.instanceof(Value);
      expect(result[0].theta.X.evaluate()).to.have.equal(2);
    });

    it('should return correct result for all variables', () => {
      let result = engine.query(ProgramFactory.literal('between(A, B, A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.have.instanceof(Variable);
      expect(result[0].theta.A.evaluate()).to.have.equal('A');

      expect(result[0].theta).to.have.property('B');
      expect(result[0].theta.B).to.have.instanceof(Variable);
      expect(result[0].theta.B.evaluate()).to.have.equal('A');
    });

    it('should return correct result for all variables', () => {
      let result = engine.query(ProgramFactory.literal('between(X, Y, X)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('X');
      expect(result[0].theta.X).to.have.instanceof(Variable);
      expect(result[0].theta.X.evaluate()).to.have.equal('X');

      expect(result[0].theta).to.have.property('Y');
      expect(result[0].theta.Y).to.have.instanceof(Variable);
      expect(result[0].theta.Y.evaluate()).to.have.equal('X');
    });

    it('should return empty array for incorrect high low values', () => {
      let result = engine.query(ProgramFactory.literal('between(8, 5, 6)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should return empty array for non-grounding 1', () => {
      let result = engine.query(ProgramFactory.literal('between(A, 5, 4)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should return empty array for non-grounding 2', () => {
      let result = engine.query(ProgramFactory.literal('between(3, A, 4)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should return empty array for non-grounding 3', () => {
      let result = engine.query(ProgramFactory.literal('between(2, 5, B)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // between/3
});
