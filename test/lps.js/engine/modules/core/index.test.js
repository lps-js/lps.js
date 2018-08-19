/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const coreModule = lpsRequire('engine/modules/core');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Program = lpsRequire('parser/Program');

const chai = require('chai');
const expect = chai.expect;

describe('coreModule', () => {
  describe('core', () => {
    describe('!/1', () => {
      it('should be defined', () => {
        let program = new Program();
        coreModule(null, program);
        let functorProvider = program.getFunctorProvider();
        expect(functorProvider.has('!/1')).to.be.true;
      });

      it('should return correct negation result', () => {
        let program = new Program();
        coreModule(null, program);

        let result = program.query(Program.literal('!fact(a)'));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return correct negation result', () => {
        let facts = new LiteralTreeMap();
        let program = new Program();
        coreModule(null, program);

        facts.add(Program.literal('fact(a)'));

        program.setFacts(facts);

        let result = program.query(Program.literal('!fact(a)'));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    });
  });
});
