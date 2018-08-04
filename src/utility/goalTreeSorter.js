const goalTreeSorter = (currentTime) => {
  return (gtA, gtB) => {
    let gtADeadline = gtA.getEarliestDeadline(currentTime);
    let gtBDeadline = gtB.getEarliestDeadline(currentTime);

    if (gtADeadline === null && gtBDeadline === null) {
      return 0;
    }

    if (gtADeadline === null) {
      return 1;
    }

    if (gtBDeadline === null) {
      return -1;
    }

    if (gtADeadline === gtBDeadline) {
      return 0;
    }

    return gtADeadline < gtBDeadline ? -1 : 1;
  };
};

module.exports = goalTreeSorter;
