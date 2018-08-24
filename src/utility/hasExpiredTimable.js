/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Timable = lpsRequire('engine/Timable');

module.exports = function hasExpiredTimable(conjunction, currentTime) {
  for (let i = 0; i < conjunction.length; i += 1) {
    if (conjunction[i] instanceof Timable
        && conjunction[i].hasExpired(currentTime)) {
      return true;
    }
  }
  return false;
};
