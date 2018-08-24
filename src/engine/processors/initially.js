/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../lpsRequire');
const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const ProgramFactory = lpsRequire('parser/ProgramFactory');

const initiallyDeclarationTerm = ProgramFactory.literal('initially(F)');

const processInitialFluent = (program, state, value) => {
  if (!(value instanceof Functor)) {
    // invalid in initially
    return;
  }
  if (!program.isFluent(value)) {
    // invalid fluent
    return;
  }
  state.add(value);
};

const processInitiallyDeclarations = (engine, program) => {
  let result = engine.query(initiallyDeclarationTerm);
  let state = program.getState();
  result.forEach((r) => {
    if (r.theta.F === undefined) {
      return;
    }
    let value = r.theta.F;
    if (value instanceof List) {
      let list = value.flatten();
      list.forEach((v) => {
        processInitialFluent(program, state, v);
      });
      return;
    }
    processInitialFluent(program, state, value);
  });
};

const initiallyProcessor = function initiallyProcessor(engine, program) {
  processInitiallyDeclarations(engine, program);
};

module.exports = initiallyProcessor;
