/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const ProgramFactory = lpsRequire('parser/ProgramFactory');

const updatesLiteral = ProgramFactory.literal('updates(Act, Old, New)');
const initiatesLiteral = ProgramFactory.literal('initiates(Act, New)');
const terminatesLiteral = ProgramFactory.literal('terminates(Act, Old)');

const updateStateWithFluentActors = function updateStateWithFluentActors(
  engine,
  executedActions,
  state
) {
  executedActions.forEach((action) => {
    let queryResult = [];
    let theta = {
      Act: action
    };
    let updatedInitiatesLiteral = initiatesLiteral.substitute(theta);
    let initiatesQueryResult = engine.query(updatedInitiatesLiteral);
    queryResult = queryResult.concat(initiatesQueryResult);

    state.forEach((fluent) => {
      theta = {
        Act: action,
        Old: fluent
      };

      let updatedUpdatesLiteral = updatesLiteral.substitute(theta);
      let updatedTerminatesLiteral = terminatesLiteral.substitute(theta);

      let stateQueryResult = [];
      stateQueryResult = stateQueryResult.concat(engine.query(updatedUpdatesLiteral));
      stateQueryResult = stateQueryResult.concat(engine.query(updatedTerminatesLiteral));
      stateQueryResult = stateQueryResult.map((tArg) => {
        let t = tArg;
        t.theta.Old = fluent;
        return t;
      });

      queryResult = queryResult.concat(stateQueryResult);
    });

    queryResult.forEach((r) => {
      if (r.theta.Old !== undefined) {
        state.remove(r.theta.Old);
      }
      if (r.theta.New !== undefined) {
        state.add(r.theta.New);
      }
    });
  });
};

module.exports = updateStateWithFluentActors;
