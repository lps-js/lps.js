/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');
const Engine = lpsRequire('engine/Engine');
const Program = lpsRequire('parser/Program');

const chai = require('chai');
const expect = chai.expect;

describe('list.lps', () => {
  let engine;

  before((done) => {
    let program = new Program();
    engine = new Engine(program);
    engine.load()
      .then(() => {
        done();
      });
  });

  describe('max_list/3', () => {
    it('should return correct value for list of 2 elements', () => {
      let result = engine.query(Program.literal('max_list([5, 8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(8);
    });

    it('should return correct value for list of more elements', () => {
      let result = engine.query(Program.literal('max_list([8, 4, 6, 10, 9], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(10);
    });

    it('should return correct value for list of only 1 element', () => {
      let result = engine.query(Program.literal('max_list([8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(8);
    });

    it('should return no result for list of no elements', () => {
      let result = engine.query(Program.literal('max_list([], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  });

  describe('min_list/3', () => {
    it('should return correct value for list of 2 elements', () => {
      let result = engine.query(Program.literal('min_list([5, 8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(5);
    });

    it('should return correct value for list of more elements', () => {
      let result = engine.query(Program.literal('min_list([8, 4, 6, 10, 9], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(4);
    });

    it('should return correct value for list of only 1 element', () => {
      let result = engine.query(Program.literal('min_list([8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(8);
    });

    it('should return no result for list of no elements', () => {
      let result = engine.query(Program.literal('min_list([], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  });

  describe('sum_list/3', () => {
    it('should return correct value for list of 2 elements', () => {
      let result = engine.query(Program.literal('sum_list([5, 8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(13);
    });

    it('should return correct value for list of more elements', () => {
      let result = engine.query(Program.literal('sum_list([8, 4, 6, 10, 9], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(37);
    });

    it('should return correct value for list of only 1 element', () => {
      let result = engine.query(Program.literal('sum_list([8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(8);
    });

    it('should return no result for list of no elements', () => {
      let result = engine.query(Program.literal('sum_list([], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(0);
    });
  });
});
