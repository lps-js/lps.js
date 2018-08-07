const coreModule = lpsRequire('engine/modules/core');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Engine = lpsRequire('engine/Engine');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Program = lpsRequire('parser/Program');

const chai = require('chai');
const expect = chai.expect;

describe('coreModule', () => {
  describe('!/1', () => {
    it('return correct negation result', () => {
      let program = new Program();
      let engine = new Engine(program);

      let result = program.query(Program.literal('!fact(a)'));
      expect(result).to.be.an('array');
      expect(result).to.be.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.an('object');
      expect(result[0].theta).to.be.empty;
    });

    it('return correct negation result', () => {
      let facts = new LiteralTreeMap();
      let program = new Program();
      let engine = new Engine(program);

      facts.add(Program.literal('fact(a)'));

      program.setFacts(facts);

      let result = program.query(Program.literal('!fact(a)'));
      expect(result).to.be.an('array');
      expect(result).to.be.length(0);
    });
  });
});
