/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const coreModule = lpsRequire('engine/modules/core');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Program = lpsRequire('engine/Program');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const Engine = lpsRequire('engine/Engine');

const chai = require('chai');
const expect = chai.expect;

describe('coreModule', () => {
  let program = new Program();
  let engine = new Engine(program);
  let functorProvider = engine.getFunctorProvider();
  coreModule(engine, program);

  describe('core', () => {
    describe('!/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('!/1')).to.be.true;
      });

      it('should return correct negation result', () => {
        let result = engine.query(ProgramFactory.literal('!fact(a)'));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return correct negation result', () => {
        let facts = new LiteralTreeMap();
        facts.add(ProgramFactory.literal('fact(a)'));
        program.setFacts(facts);

        let result = engine.query(ProgramFactory.literal('!fact(a)'));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    });
  });
});
