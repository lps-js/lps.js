const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');

function ProgramProcessor() {

  let _handlers = {};

  let _handlerTypes = [
    'auxiliary',
    'rule.antecedent.conjunct',
    'rule.consequent.conjunct',
    'clause.head',
    'clause.body.conjunct',
    'constraint.conjunct'
  ];

  _handlerTypes.forEach((type) => {
    _handlers[type] = [];
  });

  this.register = function register(type, handler) {
    if (_handlerTypes.indexOf(type) === -1) {
      throw new Error('Invalid handler type provided: ' + type);
    }


  };

  let handleTerm = function handleTerm(handlerType, term) {
    let handlers = _handlers[handlerType];

    let result = [ [term, {}] ];
    handlers.forEach((handler) => {
      let newResult = [];
      result.forEach((tuple) => {
        let subResult = handler(tuple[0], tuple[1]);
        newResult = newResult.concat(subResult);
      });
      result = newResult;
    });
    return result;
  };

  let substituteArray = function substituteArray(arr, theta) {
    return arr.map(a => a.substitute(theta));
  };

  this.process = function process(program) {
    let newAuxiliaryFacts = new LiteralTreeMap();
    program.getFacts()
      .forEach((fact) => {
        let result = handleTerm('auxiliary', fact);
        result.forEach((tuple) => {
          newAuxiliaryFacts.add(tuple[0]);
        });
      });
    program.setFacts(newAuxiliaryFacts);

    let newClauses = [];
    program.getClauses()
      .forEach((clause) => {
        let clauseSet = [];
        let headLiteral = clause.getHeadLiterals()[0];
        let result = handleTerm('clause.head', headLiteral);
        result.forEach((tuple) => {
          let newClause = clause.substitute(tuple[1]);
          newClause = new Clause([tuple[0]], newClause.getBodyLiterals());
          clauseSet.push(newClause);
        });

        let newClauseSet = [];
        clauseSet.forEach((newClause) => {
          let subClauseSet = [newClause];
          let bodyLiterals = newClause.getBodyLiterals();
          let bodyLength = bodyLiterals.length;
          for (let i = 0; i < bodyLength; i += 1) {
            let conjunct = bodyLiterals[i];
            let subResult = handleTerm('clause.body.conjunct', conjunct);
            let termsBeforeConjunct = bodyLiterals.slice(0, i);
            let termsAfterConjunct = bodyLiterals.slice(i + 1, bodyLength);
            subResult.forEach((tuple) => {

            });
            newClauseSet = newClauseSet.concat(subClauseSet);
        });
      })
  };
}

module.exports = ProgramProcessor;
