/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const compactTheta = lpsRequire('utility/compactTheta');
const Resolutor = lpsRequire('engine/Resolutor');

const fluentActorDeclarationLiteral = ProgramFactory
  .literal('fluentActorDeclare(T, A, Old, New, Conds)');

const updateStateWithFluentActors = function updateStateWithFluentActors(engine, actions, state) {
  let newState = state.clone();
  let fluentActors = [];

  // query has to be done on the spot as some of the declarations
  // may be intensional instead of static
  let result = engine.query(fluentActorDeclarationLiteral);
  let functorProvider = engine.getFunctorProvider();

  result.forEach((r) => {
    let type = r.theta.T;
    let action = r.theta.A;
    let oldFluent = r.theta.Old;
    let newFluent = r.theta.New;
    let conditions = r.theta.Conds;
    if (type === undefined
        || action === undefined
        || !(action instanceof Functor)
        || newFluent === undefined
        || oldFluent === undefined
        || !(conditions instanceof List)) {
      return;
    }
    type = type.evaluate();

    switch (type) {
      case 'update':
        fluentActors.push({
          a: action,
          i: newFluent,
          t: oldFluent,
          c: conditions
        });
        break;
      case 'initiate':
        fluentActors.push({
          a: action,
          i: newFluent,
          c: conditions
        });
        break;
      case 'terminate':
        fluentActors.push({
          a: action,
          t: oldFluent,
          c: conditions
        });
        break;
      default:
        break;
    }
  });

  fluentActors.forEach((actor) => {
    let thetaSets = [];
    actions.unifies(actor.a)
      .forEach((node) => {
        let substitutedCondition = actor.c.substitute(node.theta);
        let subQueryResult = engine.query(substitutedCondition.flatten());
        subQueryResult.forEach((tuple) => {
          thetaSets.push({
            theta: compactTheta(node.theta, tuple.theta)
          });
        });
      });

    thetaSets.forEach((node) => {
      let initiateThetaSet = [node.theta];

      // start processing terminate.
      // when terminating, we also take note of the appropriate theta sets
      // in case we are performing an update
      if (actor.t) {
        let terminatedGroundFluent = actor.t.substitute(node.theta);
        let stateThetaSet = newState.unifies(terminatedGroundFluent);
        initiateThetaSet = [];
        stateThetaSet.forEach((terminatedNode) => {
          let currentTheta = compactTheta(node.theta, terminatedNode.theta);
          initiateThetaSet.push(currentTheta);
          let terminatedFluentSet = Resolutor
            .handleBuiltInFunctorArgumentInLiteral(
              functorProvider,
              terminatedGroundFluent.substitute(currentTheta)
            );
          terminatedFluentSet.forEach((fluent) => {
            newState.remove(fluent);
          });
        });
      }

      if (actor.i) {
        // perform initiate
        // take note of theta sets given by termination
        initiateThetaSet.forEach((theta) => {
          let initiatedGroundFluent = actor.i.substitute(theta);
          let initiatedFluentSet = Resolutor
            .handleBuiltInFunctorArgumentInLiteral(
              functorProvider,
              initiatedGroundFluent
            );
          initiatedFluentSet.forEach((fluent) => {
            newState.add(fluent);
          });
        });
      }
    });
  });

  return newState;
};

module.exports = updateStateWithFluentActors;
