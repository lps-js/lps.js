const Functor = lpsRequire('engine/Functor');

const hasTimableConjunct = function hasTimableConjunct(conjunction, program, intensionalSet) {
  for (let i = 0; i < conjunction.length; i += 1) {
    let conjunct = conjunction[i];
    while (conjunct instanceof Functor && conjunct.getId() === '!/1') {
      conjunct = conjunct.getArguments()[0];
    }
    if (!(conjunct instanceof Functor)) {
      continue;
    }
    let conjunctId = conjunct.getId();
    if (program.isAction(conjunctId)
        || program.isFluent(conjunctId)
        || program.isEvent(conjunctId)
        || intensionalSet[conjunct.getId()] !== undefined) {
      return true;
    }
  }
  return false;
};

module.exports = function buildIntensionalSet(program) {
  let clauses = program.getClauses();
  let intensionalSet = {};
  let newIntensionalSet = [];

  clauses = clauses.filter((clause) => {
    if (clause.isConstraint()) {
      return false;
    }
    let headLiteral = clause.getHeadLiterals()[0];
    return !program.isAction(headLiteral)
      && !program.isEvent(headLiteral)
      && !program.isFluent(headLiteral);
  });

  let processClauses = (clause) => {
    let headLiteral = clause.getHeadLiterals()[0];
    let headLiteralId = headLiteral.getId();
    if (intensionalSet[headLiteralId] !== undefined) {
      return false;
    }
    let bodyLiterals = clause.getBodyLiterals();
    if (hasTimableConjunct(bodyLiterals, program, intensionalSet)) {
      newIntensionalSet.push(headLiteral);
      return false;
    }
    return true;
  };
  do {
    newIntensionalSet = [];
    // filter out
    clauses = clauses.filter(processClauses);

    newIntensionalSet.forEach((predicate) => {
      intensionalSet[predicate.getId()] = true;
    });
  } while (newIntensionalSet.length > 0);
  return intensionalSet;
};
