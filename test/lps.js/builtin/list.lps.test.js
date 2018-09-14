/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');
const List = lpsRequire('engine/List');
const Engine = lpsRequire('engine/Engine');
const Program = lpsRequire('engine/Program');
const ProgramFactory = lpsRequire('parser/ProgramFactory');

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

  describe('length/2', () => {
    it('should return correct result for variable replacement', () => {
      let result = engine.query(ProgramFactory.literal('length([a, b, c], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(3);
    });

    it('should return correct result for matching output', () => {
      let result = engine.query(ProgramFactory.literal('length([a, b, c], 3)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.empty;
    });

    it('should return empty array for incorrect result', () => {
      let result = engine.query(ProgramFactory.literal('length([a, b, c], 2)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // length/2

  describe('append/3', () => {
    it('should return correct result for appending two arrays', () => {
      let result = engine.query(ProgramFactory.literal('append([a, b], [c], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(List);
      let list = result[0].theta.A.flatten().map(value => value.evaluate());
      expect(list).to.include.members(['a', 'b', 'c']);
    });

    it('should return correct result for invalid input 1', () => {
      let result = engine.query(ProgramFactory.literal('append([a, b], c, A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should return correct result for invalid input 2', () => {
      let result = engine.query(ProgramFactory.literal('append(a, [c], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should return correct result for invalid input 3', () => {
      let result = engine.query(ProgramFactory.literal('append([a, b], [c], [a, b, c])'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // append/3

  describe('max_list/3', () => {
    it('should return correct value for list of 2 elements', () => {
      let result = engine.query(ProgramFactory.literal('max_list([5, 8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(8);
    });

    it('should return correct value for list of more elements', () => {
      let result = engine.query(ProgramFactory.literal('max_list([8, 4, 6, 10, 9], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(10);
    });

    it('should return correct value for list of only 1 element', () => {
      let result = engine.query(ProgramFactory.literal('max_list([8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(8);
    });

    it('should return no result for list of no elements', () => {
      let result = engine.query(ProgramFactory.literal('max_list([], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // max_list/3

  describe('min_list/3', () => {
    it('should return correct value for list of 2 elements', () => {
      let result = engine.query(ProgramFactory.literal('min_list([5, 8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(5);
    });

    it('should return correct value for list of more elements', () => {
      let result = engine.query(ProgramFactory.literal('min_list([8, 4, 6, 10, 9], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(4);
    });

    it('should return correct value for list of only 1 element', () => {
      let result = engine.query(ProgramFactory.literal('min_list([8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(8);
    });

    it('should return no result for list of no elements', () => {
      let result = engine.query(ProgramFactory.literal('min_list([], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  }); // min_list/3

  describe('sum_list/3', () => {
    it('should return correct value for list of 2 elements', () => {
      let result = engine.query(ProgramFactory.literal('sum_list([5, 8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(13);
    });

    it('should return correct value for list of more elements', () => {
      let result = engine.query(ProgramFactory.literal('sum_list([8, 4, 6, 10, 9], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(37);
    });

    it('should return correct value for list of only 1 element', () => {
      let result = engine.query(ProgramFactory.literal('sum_list([8], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(8);
    });

    it('should return no result for list of no elements', () => {
      let result = engine.query(ProgramFactory.literal('sum_list([], A)'));

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('theta');

      expect(result[0].theta).to.have.property('A');
      expect(result[0].theta.A).to.be.instanceof(Value);
      expect(result[0].theta.A.evaluate()).to.be.equal(0);
    });
  }); // sum_list/3
});
