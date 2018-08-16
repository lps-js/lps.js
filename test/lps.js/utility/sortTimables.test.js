/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const sortTimables = lpsRequire('utility/sortTimables');
const Timable = lpsRequire('engine/Timable');
const Functor = lpsRequire('engine/Functor');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');

const chai = require('chai');
const expect = chai.expect;

describe('sortTimables', () => {
  it('should return the correct result for same-time conjuncts', () => {
    let conjunction = [
      new Timable(new Functor('act1'), new Variable('T'), new Variable('T')),
      new Timable(new Functor('act2'), new Variable('T'), new Variable('T'))
    ];

    let pair = sortTimables(conjunction, 1);

    expect(pair).to.be.an('array');
    expect(pair).to.be.length(2);

    let earlyConjuncts = pair[0];
    let laterConjuncts = pair[1];

    expect(earlyConjuncts).to.be.an('array');
    expect(earlyConjuncts).to.be.length(2);
    expect(earlyConjuncts).to.include.members(conjunction);

    expect(laterConjuncts).to.be.an('array');
    expect(laterConjuncts).to.be.length(0);
  });

  it('should return the correct result for time-ordered conjuncts', () => {
    let conjunction = [
      new Timable(new Functor('act1'), new Value(1), new Variable('T2')),
      new Timable(new Functor('act2'), new Value(2), new Variable('T3'))
    ];

    let pair = sortTimables(conjunction, 1);

    expect(pair).to.be.an('array');
    expect(pair).to.be.length(2);

    let earlyConjuncts = pair[0];
    let laterConjuncts = pair[1];

    expect(earlyConjuncts).to.be.an('array');
    expect(earlyConjuncts).to.be.length(1);
    expect(earlyConjuncts).to.include(conjunction[0]);

    expect(laterConjuncts).to.be.an('array');
    expect(laterConjuncts).to.be.length(1);
    expect(laterConjuncts).to.include(conjunction[1]);
  });

  it('should return the correct result for time-disordered conjuncts', () => {
    let conjunction = [
      new Timable(new Functor('act1'), new Value(2), new Variable('T2')),
      new Timable(new Functor('act2'), new Value(1), new Variable('T3'))
    ];

    let pair = sortTimables(conjunction, 1);

    expect(pair).to.be.an('array');
    expect(pair).to.be.length(2);

    let earlyConjuncts = pair[0];
    let laterConjuncts = pair[1];

    expect(earlyConjuncts).to.be.an('array');
    expect(earlyConjuncts).to.be.length(1);
    expect(earlyConjuncts).to.include(conjunction[1]);

    expect(laterConjuncts).to.be.an('array');
    expect(laterConjuncts).to.be.length(1);
    expect(laterConjuncts).to.include(conjunction[0]);
  });

  it('should return the correct result for more time-disordered conjuncts', () => {
    let conjunction = [
      new Timable(new Functor('act1'), new Value(3), new Variable('T1')),
      new Timable(new Functor('act1'), new Value(2), new Variable('T2')),
      new Timable(new Functor('act2'), new Value(1), new Variable('T3'))
    ];

    let pair = sortTimables(conjunction, 1);

    expect(pair).to.be.an('array');
    expect(pair).to.be.length(2);

    let earlyConjuncts = pair[0];
    let laterConjuncts = pair[1];

    expect(earlyConjuncts).to.be.an('array');
    expect(earlyConjuncts).to.be.length(1);
    expect(earlyConjuncts).to.include(conjunction[2]);

    expect(laterConjuncts).to.be.an('array');
    expect(laterConjuncts).to.be.length(2);
    expect(laterConjuncts).to.include.members([conjunction[0], conjunction[1]]);
  });

  it('should return the correct result for later conjuncts', () => {
    let conjunction = [
      new Timable(new Functor('act1'), new Value(3), new Variable('T2')),
      new Timable(new Functor('act2'), new Value(2), new Variable('T3'))
    ];

    let pair = sortTimables(conjunction, 1);

    expect(pair).to.be.an('array');
    expect(pair).to.be.length(2);

    let earlyConjuncts = pair[0];
    let laterConjuncts = pair[1];

    expect(earlyConjuncts).to.be.an('array');
    expect(earlyConjuncts).to.be.length(0);

    expect(laterConjuncts).to.be.an('array');
    expect(laterConjuncts).to.be.length(2);
    expect(laterConjuncts).to.include.members(conjunction);
  });

  it('should return the correct result for untimed ordered conjuncts', () => {
    let conjunction = [
      new Timable(new Functor('act1'), new Variable('T1'), new Variable('T2')),
      new Timable(new Functor('act2'), new Variable('T2'), new Variable('T3'))
    ];

    let pair = sortTimables(conjunction, 1);

    expect(pair).to.be.an('array');
    expect(pair).to.be.length(2);

    let earlyConjuncts = pair[0];
    let laterConjuncts = pair[1];

    expect(earlyConjuncts).to.be.an('array');
    expect(earlyConjuncts).to.be.length(1);
    expect(earlyConjuncts).to.include(conjunction[0]);

    expect(laterConjuncts).to.be.an('array');
    expect(laterConjuncts).to.be.length(1);
    expect(laterConjuncts).to.include(conjunction[1]);
  });

  it('should return the correct result for untimed same-time conjuncts', () => {
    let conjunction = [
      new Timable(new Functor('act1'), new Variable('T1'), new Variable('T2')),
      new Timable(new Functor('act2'), new Variable('T1'), new Variable('T2'))
    ];

    let pair = sortTimables(conjunction, 1);

    expect(pair).to.be.an('array');
    expect(pair).to.be.length(2);

    let earlyConjuncts = pair[0];
    let laterConjuncts = pair[1];

    expect(earlyConjuncts).to.be.an('array');
    expect(earlyConjuncts).to.be.length(2);
    expect(earlyConjuncts).to.include.members(conjunction);

    expect(laterConjuncts).to.be.an('array');
    expect(laterConjuncts).to.be.length(0);
  });

  it('should return the correct result for untimed disordered conjuncts', () => {
    let conjunction = [
      new Timable(new Functor('act1'), new Variable('T2'), new Variable('T3')),
      new Timable(new Functor('act2'), new Variable('T1'), new Variable('T2'))
    ];

    let pair = sortTimables(conjunction, 1);

    expect(pair).to.be.an('array');
    expect(pair).to.be.length(2);

    let earlyConjuncts = pair[0];
    let laterConjuncts = pair[1];

    expect(earlyConjuncts).to.be.an('array');
    expect(earlyConjuncts).to.be.length(1);
    expect(earlyConjuncts).to.include(conjunction[1]);

    expect(laterConjuncts).to.be.an('array');
    expect(laterConjuncts).to.be.length(1);
    expect(laterConjuncts).to.include(conjunction[0]);
  });
});
