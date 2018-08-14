const coreModule = lpsRequire('engine/modules/core');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Program = lpsRequire('parser/Program');

const chai = require('chai');
const expect = chai.expect;

describe('coreModule', () => {
  describe('types', () => {
    describe('is_ground/1', () => {
      let program;
      beforeEach(() => {
        program = new Program();

        // core module is loaded by Engine
        coreModule(null, program);
      });

      it('should be defined', () => {
        let functorProvider = program.getFunctorProvider();
        expect(functorProvider.has('is_ground/1')).to.be.true;
      });

      it('should return is_ground() correctly for ground term', () => {
        let functorProvider = program.getFunctorProvider();
        let params = [
          new Value(1)
        ];
        let result = functorProvider.execute(new Functor('is_ground', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return is_ground() correctly for unground term', () => {
        let functorProvider = program.getFunctorProvider();
        let params = [
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('is_ground', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    });
  });
});
