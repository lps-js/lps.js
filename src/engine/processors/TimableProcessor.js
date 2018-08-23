/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Clause = lpsRequire('engine/Clause');
const createLiteralTimingMapper = lpsRequire('utility/createLiteralTimingMapper');

const TimableProcessor = function TimableProcessor(engine, program) {
  let timableMapper = createLiteralTimingMapper(program);

  let rules = program.getRules();
  rules = rules.map((rule) => {
    let antecedent = rule.getBodyLiterals()
      .map(timableMapper);
    let consequent = rule.getHeadLiterals()
      .map(timableMapper);

    return new Clause(consequent, antecedent);
  });
  program.setRules(rules);

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

module.exports = TimableProcessor;
