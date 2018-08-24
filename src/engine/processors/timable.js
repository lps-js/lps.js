/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../lpsRequire');
const Clause = lpsRequire('engine/Clause');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const SyntacticSugar = lpsRequire('utility/SyntacticSugar');
const createLiteralTimingMapper = lpsRequire('utility/createLiteralTimingMapper');

const fluentDeclarationTerm = ProgramFactory.literal('fluent(X)');
const actionDeclarationTerm = ProgramFactory.literal('action(X)');
const eventDeclarationTerm = ProgramFactory.literal('event(X)');

const processTimableDeclarations = (engine, program, query, define) => {
  let result = engine.query(query);
  result.forEach((r) => {
    if (r.theta.X === undefined) {
      return;
    }
    define(SyntacticSugar.shorthand(r.theta.X));
  });
};

const processRules = (timableMapper, program) => {
  let rules = program.getRules();
  rules = rules.map((rule) => {
    let antecedent = rule.getBodyLiterals()
      .map(timableMapper);
    let consequent = rule.getHeadLiterals()
      .map(timableMapper);

    return new Clause(consequent, antecedent);
  });
  program.setRules(rules);
};

const processClauses = (timableMapper, program) => {
  let clauses = program.getClauses();
  clauses = clauses.map((clause) => {
    let bodyLiterals = clause.getBodyLiterals()
      .map(timableMapper);
    let headLiterals = clause.getHeadLiterals()
      .map(timableMapper);

    return new Clause(headLiterals, bodyLiterals);
  });
  program.setClauses(clauses);
};

const timableProcessor = function timableProcessor(engine, program) {
  processTimableDeclarations(engine, program, fluentDeclarationTerm, program.defineFluent);
  processTimableDeclarations(engine, program, actionDeclarationTerm, program.defineAction);
  processTimableDeclarations(engine, program, eventDeclarationTerm, program.defineEvent);

  let timableMapper = createLiteralTimingMapper(program);
  processRules(timableMapper, program);
  processClauses(timableMapper, program);
};

module.exports = timableProcessor;
