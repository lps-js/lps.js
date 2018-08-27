/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Resolutor = lpsRequire('engine/Resolutor');
const Clause = lpsRequire('engine/Clause');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Program = lpsRequire('engine/Program');
const Variable = lpsRequire('engine/Variable');
const Engine = lpsRequire('engine/Engine');

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
      let engine = new Engine(program);
      program.setState(state);

      let result = Resolutor.reduceRuleAntecedent(engine, [state], rule, 1);
      expect(result).to.be.instanceof(Array);
      expect(result).to.be.length(1);
      expect(result[0].theta).to.be.not.undefined;
      expect(Object.keys(result[0].theta)).to.be.length(1);
      expect(result[0].theta.T1).to.be.not.undefined;
      expect(result[0].theta.T1).to.be.instanceof(Value);
      expect(result[0].theta.T1.evaluate()).to.be.equal(1);
    });

    it('should return the correct result', () => {
      let rule = new Clause(
        [new Functor('buy', [new Value('alice'), new Variable('Item')])],
        [new Functor('wantToBuy', [new Value('alice'), new Variable('Item')])]
      );

      let state = new LiteralTreeMap();
      state.add(new Functor('wantToBuy', [new Value('alice'), new Value('cereal')]));
      let program = new Program();
      let engine = new Engine(program);
      // program.setState(state);

      let result = Resolutor.reduceRuleAntecedent(engine, [state], rule, 1);
      expect(result).to.be.instanceof(Array);
      expect(result).to.be.length(1);
      expect(result[0].theta).to.be.not.undefined;
      expect(Object.keys(result[0].theta)).to.be.length(1);
      expect(result[0].theta.Item).to.be.not.undefined;
      expect(result[0].theta.Item).to.be.instanceof(Value);
      expect(result[0].theta.Item.evaluate()).to.be.equal('cereal');
    });
  });
});
