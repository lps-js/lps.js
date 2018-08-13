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
