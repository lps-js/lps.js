function sortTimables(conjunction, forTime) {
  let earlyConjuncts = [];
  let laterConjuncts = [];

  conjunction.forEach((conjunct) => {
    if (!conjunct.isInRange(forTime)) {
      laterConjuncts.push(conjunct);
      return;
    }

    if (earlyConjuncts.length === 0) {
      earlyConjuncts.push(conjunct);
      return;
    }

    for (let i = 0; i < earlyConjuncts; i += 1) {
      if (conjunct.isEarlierThan(earlyConjuncts[i])) {
        laterConjuncts = laterConjuncts.concat(earlyConjuncts);
        earlyConjuncts = [conjunct];
        return;
      }
    }

    if (conjunct.isLaterThan(earlyConjuncts[0])) {
      laterConjuncts.push(conjunct);
      return;
    }
    earlyConjuncts.push(conjunct);
  });

  return [
    earlyConjuncts,
    laterConjuncts
  ];
}

module.exports = sortTimables;
