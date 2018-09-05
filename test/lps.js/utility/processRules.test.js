/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const processRules = lpsRequire('utility/processRules');
const Functor = lpsRequire('engine/Functor');
const Clause = lpsRequire('engine/Clause');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');
const Program = lpsRequire('engine/Program');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Engine = lpsRequire('engine/Engine');
const Profiler = lpsRequire('utility/profiler/Profiler');

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
    let profiler = new Profiler();
    let events = new LiteralTreeMap();
    events.add(new Functor('smoke_detected', [new Value('kitchen'), new Value(14), new Value(15)]));

    let program = new Program();
    let engine = new Engine(program);
    program.setRules([rule]);

    program.setExecutedActions(events);

    let goals = [];
    let result = processRules(engine, program, [events], 15, profiler);
    expect(result).to.be.instanceof(Array);
    expect(result).to.be.length(0);
  });
});
