/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');
const Engine = lpsRequire('engine/Engine');
const Program = lpsRequire('parser/Program');

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
      let result = engine.query(Program.literal('sin(60, A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(Math.sin(60));
    });

    it('should return correct result for variable replacement', () => {
      let result = engine.query(Program.literal('sin(60, ' + Math.sin(60) + ')'));
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.have.be.empty;
    });

    it('should return empty array for non-match', () => {
      let result = engine.query(Program.literal('sin(60, 2)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // describe sin/2

  describe('cos/2', () => {
    it('should return correct result for variable replacement', () => {
      let result = engine.query(Program.literal('cos(60, A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(Math.cos(60));
    });

    it('should return correct result for variable replacement', () => {
      let result = engine.query(Program.literal('cos(60, ' + Math.cos(60) + ')'));
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.have.be.empty;
    });

    it('should return empty array for non-match', () => {
      let result = engine.query(Program.literal('cos(60, 2)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // describe cos/2

  describe('tan/2', () => {
    it('should return correct result for variable replacement', () => {
      let result = engine.query(Program.literal('tan(60, A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(Math.tan(60));
    });

    it('should return correct result for variable replacement', () => {
      let result = engine.query(Program.literal('tan(60, ' + Math.tan(60) + ')'));
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.have.be.empty;
    });

    it('should return empty array for non-match', () => {
      let result = engine.query(Program.literal('tan(60, 2)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // describe tan/2
});
