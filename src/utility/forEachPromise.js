module.exports = function forEach(iterable) {
  let len = iterable.length;
  let blockLimit = 100;
  let iterator = function(action, i, done) {
    let upper = i + blockLimit;
    for (let k = i; k < upper; k += 1) {
      if (k >= len) {
        done();
        return;
      }
      action(iterable[k], k);
    }
    setTimeout(() => {
      iterator(action, upper, done);
    }, 0);
  };
  return {
    do: function (action) {
      return new Promise((resolve) => {
        setTimeout(() => {
          iterator(action, 0, resolve);
        }, 0);
      });
    }
  };
}
