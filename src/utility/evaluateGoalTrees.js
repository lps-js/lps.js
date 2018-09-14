/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const ConjunctionMap = lpsRequire('engine/ConjunctionMap');

/**
 * Perform evaluation on all given goal trees
 * @param  {number} currentTime The current time in execution at pre-cycle
 * @param  {Array<GoalTree>} goalTrees   The array of goal trees to process
 * @param  {Profiler} profiler   The engine profiler
 * @return {Promise}             Returns a promise that when fulfilled, provides the new set
 *                               of goal trees.
 */
module.exports = function evaluateGoalTrees(currentTime, goalTrees, profiler) {
  let processedNodes = new ConjunctionMap();
  let goalTreeProcessingPromises = [];
  let newGoals = [];

  // perform evaluation on all the goal trees
  goalTrees.forEach((goalTree) => {
    let treePromise = goalTree
      .evaluate(currentTime, processedNodes)
      .then((evaluationResult) => {
        if (evaluationResult === null) {
          // goal tree failed
          profiler.increment('lastCycleNumFailedGoals');
          profiler.increment('totalNumFailedGoals');
          return Promise.resolve();
        }

        // goal tree has been resolved
        if (evaluationResult.length > 0) {
          profiler.increment('lastCycleNumResolvedGoals');
          profiler.increment('totalNumResolvedGoals');
          return Promise.resolve();
        }

        // goal tree has not been resolved, so let's persist the tree
        // to the next cycle
        newGoals.push(goalTree);
        return Promise.resolve();
      });
    goalTreeProcessingPromises.push(treePromise);
  });

  return Promise.all(goalTreeProcessingPromises)
    .then(() => {
      // ensure goal trees are sorted by their deadlines
      return Promise.resolve(newGoals);
    });
};
