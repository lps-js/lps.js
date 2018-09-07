/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const compactTheta = lpsRequire('utility/compactTheta');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const Resolutor = lpsRequire('engine/Resolutor');

const updatesLiteral = ProgramFactory.literal('updates(Act, Old, New)');
const initiatesLiteral = ProgramFactory.literal('initiates(Act, New)');
const terminatesLiteral = ProgramFactory.literal('terminates(Act, Old)');

const updateStateWithFluentActors = function updateStateWithFluentActors(
  engine,
  executedActions,
  state
) {
  let fluentActors = [];

  // query has to be done on the spot as some of the declarations
  // may be intensional instead of static
  let functorProvider = engine.getFunctorProvider();

  executedActions.forEach((action) => {
    // console.log('act \t ' + action);
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

      // console.log('f\t'+fluent);

      let updatedUpdatesLiteral = updatesLiteral.substitute(theta);
      let updatedTerminatesLiteral = terminatesLiteral.substitute(theta);

      // console.log('UP\t' + updatedUpdatesLiteral);

      let stateQueryResult = [];
      stateQueryResult = stateQueryResult.concat(engine.query(updatedUpdatesLiteral));
      stateQueryResult = stateQueryResult.concat(engine.query(updatedTerminatesLiteral));
      stateQueryResult = stateQueryResult.map((t) => {
        t.theta.Old = fluent;
        return t;
      });

      queryResult = queryResult.concat(stateQueryResult);
    });

    queryResult.forEach((r) => {
      // console.log('Old \\ ' + r.theta.Old);
      // console.log('New \\ ' + r.theta.New);
      if (r.theta.Old !== undefined) {
        state.remove(r.theta.Old);
      }
      if (r.theta.New !== undefined) {
        state.add(r.theta.New);
      }
    });
  });

  // console.log(queryResult);
};

module.exports = updateStateWithFluentActors;
