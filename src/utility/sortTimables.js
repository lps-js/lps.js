/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');
const Timable = lpsRequire('engine/Timable');

/**
 * Sort timables into set of earlyConjuncts and laterConjuncts
 * @param  {Array} conjunction The conjunction. Must be an array of functors or timables
 * @param  {number} forTime     A positive integer of the time to determine earlyConjuncts
 * @return {Array}             Return a pair of early conjuncts and later conjuncts
 */
function sortTimables(conjunction, forTime) {
  let earlyConjuncts = [];
  let laterConjuncts = [];

  let dependentTimeVariables = {};

  // determine the time dependent variables
  for (let k = 0; k < conjunction.length; k += 1) {
    let conjunct = conjunction[k];

    if (!(conjunct instanceof Timable)) {
      // skip over non-Timables
      continue;
    }

    let conjunctStartTime = conjunct.getStartTime();
    let conjunctEndTime = conjunct.getEndTime();

    if (conjunctEndTime instanceof Variable) {
      let endTimeName = conjunctEndTime.evaluate();
      if (conjunctStartTime instanceof Value
          || (conjunctStartTime instanceof Variable
            && conjunctStartTime.evaluate() !== endTimeName)) {
        // different start/end times
        dependentTimeVariables[endTimeName] = true;
      }
    }
  }

  // sort between early and later
  for (let k = 0; k < conjunction.length; k += 1) {
    let conjunct = conjunction[k];

    if (!(conjunct instanceof Timable)) {
      if (laterConjuncts.length > 0) {
        laterConjuncts.push(conjunct);
        continue;
      }
      earlyConjuncts.push(conjunct);
      continue;
    }

    if (!conjunct.isInRange(forTime)) {
      laterConjuncts.push(conjunct);
      continue;
    }

    let conjunctStartTime = conjunct.getStartTime();

    if (conjunctStartTime instanceof Variable) {
      if (dependentTimeVariables[conjunctStartTime.evaluate()] !== undefined) {
        laterConjuncts.push(conjunct);
        continue;
      }
    }

    earlyConjuncts.push(conjunct);
  }

  return [
    earlyConjuncts,
    laterConjuncts
  ];
}

module.exports = sortTimables;
