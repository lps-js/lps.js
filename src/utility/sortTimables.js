const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');

function sortTimables(conjunction, forTime) {
  let earlyConjuncts = [];
  let laterConjuncts = [];

  let dependentTimeVariables = {};

  for (let k = 0; k < conjunction.length; k += 1) {
    let conjunct = conjunction[k];
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

  for (let k = 0; k < conjunction.length; k += 1) {
    let conjunct = conjunction[k];
    if (!conjunct.isInRange(forTime)) {
      laterConjuncts.push(conjunct);
      continue;
    }

    let movedToLater = [];
    for (let i = 0; i < earlyConjuncts; i += 1) {
      if (conjunct.isEarlierThan(earlyConjuncts[i])) {
        laterConjuncts = laterConjuncts.concat(earlyConjuncts);
        earlyConjuncts = [conjunct];
      }
    }

    let conjunctStartTime = conjunct.getStartTime();

    if (conjunctStartTime instanceof Variable) {
      if(dependentTimeVariables[conjunctStartTime.evaluate()] !== undefined) {
        laterConjuncts.push(conjunct);
        continue;
      }

      // let conjunctEndTime = conjunct.getEndTime();
      // if (conjunctEndTime instanceof Variable) {
      //   let endTimeName = conjunctEndTime.evaluate();
      //   if (conjunctStartTime.evaluate() !== endTimeName) {
      //     // different start/end times
      //     dependentTimeVariables[endTimeName] = true;
      //   }
      // }
    }
    earlyConjuncts.push(conjunct);
  }

  return [
    earlyConjuncts,
    laterConjuncts
  ];
}

module.exports = sortTimables;
