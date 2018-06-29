const processRules = require('../../src/utility/processRules');
const Functor = require('../../src/engine/Functor');
const Clause = require('../../src/engine/Clause');
const Variable = require('../../src/engine/Variable');
const Value = require('../../src/engine/Value');
const Program = require('../../src/parser/Program');
const LiteralTreeMap = require('../../src/engine/LiteralTreeMap');

const chai = require('chai');
const expect = chai.expect;

describe('processRules', () => {
  it('should return the test result', () => {
    let rule = new Clause(
      [new Functor('fire_response', [new Variable('Area'), new Variable('T5'), new Variable('T6')])],
      [
        new Functor('head_sensed', [new Variable('Area'), new Variable('T1'), new Variable('T2')]),
        new Functor('smoke_detected', [new Variable('Area'), new Variable('T3'), new Variable('T4')]),
        new Functor('<=', [new Functor('abs', [new Functor('-', [new Variable('T2'), new Variable('T4')])]), new Value(60)])
      ]
    );

    let events = new LiteralTreeMap();
    events.add(new Functor('smoke_detected', [new Value('kitchen'), new Value(14), new Value(15)]));

    let program = new Program();
    program.updateRules([rule]);

    program.setExecutedActions(events);

    let goals = [];
    let result = processRules(program, goals);
    expect(result).to.be.instanceof(Array);
    expect(result).to.be.length(0);
  });
});
