/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../lpsRequire');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const ProgramFactory = lpsRequire('parser/ProgramFactory');

const maxTimeDeclarationTerm = ProgramFactory.literal('maxTime(X)');
const cycleIntervalDeclarationTerm = ProgramFactory.literal('cycleInterval(X)');
const continuousExecutionDeclarationTerm = ProgramFactory.literal('continuousExecution(X)');

const processSettingsDeclarations = (engine, query, define) => {
  let result = engine.query(query);
  result.forEach((r) => {
    if (r.theta.X === undefined || !(r.theta.X instanceof Value)) {
      return;
    }
    define(r.theta.X.evaluate());
  });
};

const processContinuousExecutionDeclarations = (engine) => {
  let result = engine.query(continuousExecutionDeclarationTerm);
  result.forEach((r) => {
    if (r.theta.X === undefined
        || !(r.theta.X instanceof Value || r.theta.X instanceof Functor)) {
      return;
    }
    let value = r.theta.X.evaluate();
    engine.setContinuousExecution(value === 'yes'
      || value === 'on'
      || value === 'true'
      || value === 1);
  });
};

// eslint-disable-next-line no-unused-vars
const settingsProcessor = function settingsProcessor(engine, program) {
  processSettingsDeclarations(
    engine,
    maxTimeDeclarationTerm,
    engine.setMaxTime
  );
  processSettingsDeclarations(
    engine,
    cycleIntervalDeclarationTerm,
    engine.setCycleInterval
  );
  processContinuousExecutionDeclarations(engine);
};

module.exports = settingsProcessor;
