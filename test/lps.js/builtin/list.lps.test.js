const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
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
        done()
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
});
