/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');
const Engine = lpsRequire('engine/Engine');
const Program = lpsRequire('engine/Program');
const ProgramFactory = lpsRequire('parser/ProgramFactory');

const chai = require('chai');
const expect = chai.expect;

describe('types.lps', () => {
  let engine;

  before((done) => {
    let program = new Program();
    engine = new Engine(program);
    engine.load()
      .then(() => {
        done();
      });
  });

  describe('atom_number/2', () => {
    it('should return correct value converting a string representation of number to number', () => {
      let result = engine.query(ProgramFactory.literal('atom_number(\'5\', A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(5);
    });

    it('should return no result for a NaN conversion.', () => {
      let result = engine.query(ProgramFactory.literal('atom_number(\'a\', A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  });

  describe('atom_string/2', () => {
    it('should return correct value converting a string representation of number to number', () => {
      let result = engine.query(ProgramFactory.literal('atom_string(\'100\', A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal('100');
    });

    it('should return correct result for a string to string conversion.', () => {
      let result = engine.query(ProgramFactory.literal('atom_string(\'a\', A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal('a');
    });
  });
});
