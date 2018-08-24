/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const ConjunctionMap = lpsRequire('engine/ConjunctionMap');
const goalTreeSorter = lpsRequire('utility/goalTreeSorter');

module.exports = function evaluateGoalTrees(currentTime, goalTrees, profiler) {
  let goalTreeProcessingPromises = [];
  let newGoals = [];
  let processedNodes = new ConjunctionMap();
  goalTrees.forEach((goalTree) => {
    let treePromise = goalTree
      .evaluate(currentTime, processedNodes)
      .then((evaluationResult) => {
        if (evaluationResult === null) {
          // goal tree failed
          profiler.increment('lastCycleNumFailedGoal');
          profiler.increment('totalNumFailedGoal');
          return Promise.resolve();
        }

        // goal tree has been resolved
        if (evaluationResult.length > 0) {
          profiler.increment('lastCycleNumResolvedGoal');
          profiler.increment('totalNumResolvedGoal');
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
      newGoals.sort(goalTreeSorter(currentTime));
      return Promise.resolve(newGoals);
    });
};
