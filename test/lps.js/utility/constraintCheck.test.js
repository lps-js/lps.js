/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const constraintCheck = lpsRequire('utility/constraintCheck');
const Functor = lpsRequire('engine/Functor');
const Clause = lpsRequire('engine/Clause');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');
const Program = lpsRequire('engine/Program');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Engine = lpsRequire('engine/Engine');

const chai = require('chai');
const expect = chai.expect;

describe('constraintCheck', () => {
  it('should return false on constraint failure', () => {
    let constraint = new Clause(
      [],
      [
        new Functor('lend', [new Variable('Person'), new Variable('Person'), new Variable('Amount')])
      ]
    );

    let events = new LiteralTreeMap();
    events.add(new Functor('lend', [new Functor('alice', []), new Functor('alice', []), new Value(15)]));

    let program = new Program();
    program.setConstraints([constraint]);
    program.setExecutedActions(events);

    let engine = new Engine(program);

    let result = constraintCheck(engine, program);
    expect(result).to.be.false;
  });
});
