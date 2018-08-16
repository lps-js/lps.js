/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

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
