const Clause = lpsRequire('engine/Clause');
const Timable = lpsRequire('engine/Timable');
const Variable = lpsRequire('engine/Variable');
const Functor = lpsRequire('engine/Functor');
const createLiteralTimingMapper = lpsRequire('utility/createLiteralTimingMapper');
const buildIntensionalSet = lpsRequire('utility/buildIntensionalSet');

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
  program.updateRules(rules);

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
