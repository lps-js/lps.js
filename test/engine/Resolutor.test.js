const Resolutor = require('../../src/engine/Resolutor');
const Clause = require('../../src/engine/Clause');
const LiteralTreeMap = require('../../src/engine/LiteralTreeMap');
const Functor = require('../../src/engine/Functor');
const Value = require('../../src/engine/Value');
const Variable = require('../../src/engine/Variable');
const FunctorProvider = require('../../src/engine/FunctorProvider');

const chai = require('chai');
const expect = chai.expect;

describe('Resolutor', () => {
  describe('reduceRuleAntecedent', () => {
    it('should return the test result', () => {
      let rule = new Clause(
        [new Functor('deal_with_fire', [new Variable('T1'), new Variable('T2')])],
        [new Functor('fire', [new Variable('T1')])]
      );

      let facts = new LiteralTreeMap();
      facts.add(new Functor('fire', [new Value(1)]));
      let functorProvider = new FunctorProvider((literal) => {
        return Resolutor.findUnifications(literal, facts);
      });

      let result = Resolutor.reduceRuleAntecedent(functorProvider, rule, facts);
      console.log(result);
    });
  });
});
