const Resolutor = lpsRequire('engine/Resolutor');
const Clause = lpsRequire('engine/Clause');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Program = lpsRequire('parser/Program');
const Variable = lpsRequire('engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('Resolutor', () => {
  describe('reduceRuleAntecedent', () => {
    it('should return the test result', () => {
      let rule = new Clause(
        [new Functor('deal_with_fire', [new Variable('T1'), new Variable('T2')])],
        [new Functor('fire', [new Variable('T1')])]
      );

      let state = new LiteralTreeMap();
      state.add(new Functor('fire', [new Value(1)]));
      let program = new Program();
      program.updateState(state);

      let result = Resolutor.reduceRuleAntecedent(program, rule, []);
      expect(result).to.be.instanceof(Array);
      expect(result).to.be.length(1);
      expect(result[0].theta).to.be.not.undefined;
      expect(Object.keys(result[0].theta)).to.be.length(1);
      expect(result[0].theta.T1).to.be.not.undefined;
      expect(result[0].theta.T1).to.be.instanceof(Value);
      expect(result[0].theta.T1.evaluate()).to.be.equal(1);
    });
  });
});
