/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Timable = lpsRequire('engine/Timable');
const Functor = lpsRequire('engine/Functor');

const createLiteralTimingMapper = function createLiteralTimingMapper(program) {
  return (_literal) => {
    let literal = _literal;
    if (literal instanceof Timable) {
      return literal;
    }

    let isNegated = false;
    while (literal instanceof Functor && literal.getId() === '!/1') {
      isNegated = !isNegated;
      literal = literal.getArguments()[0];
    }

    let literalArgs = literal.getArguments();
    let goal;
    if (program.isFluent(literal.getName() + '/' + (literal.getArgumentCount() - 1))) {
      let timing = literalArgs[literalArgs.length - 1];
      // take out the timing argument
      literalArgs = literalArgs.slice(0, literalArgs.length - 1);
      goal = new Functor(literal.getName(), literalArgs);
      if (isNegated) {
        goal = new Functor('!', [goal]);
      }
      return new Timable(goal, timing, timing);
    }

    let actionName = literal.getName() + '/' + (literal.getArgumentCount() - 2);
    if (program.isAction(actionName) || program.isEvent(actionName)) {
      let startTime = literalArgs[literalArgs.length - 2];
      let endTime = literalArgs[literalArgs.length - 1];
      // take out the timing arguments
      literalArgs = literalArgs.slice(0, literalArgs.length - 2);
      goal = new Functor(literal.getName(), literalArgs);
      if (isNegated) {
        goal = new Functor('!', [goal]);
      }
      return new Timable(goal, startTime, endTime);
    }

    goal = literal;
    if (isNegated) {
      goal = new Functor('!', [goal]);
    }
    return goal;
  };
};

module.exports = createLiteralTimingMapper;
