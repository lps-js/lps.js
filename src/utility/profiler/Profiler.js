/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

function Profiler() {
  let _values = {};

  this.reset = function reset(key) {
    _values[key] = 0;
  };

  this.increment = function increment(key) {
    if (_values[key] === undefined
        || typeof _values[key] !== 'number') {
      return;
    }
    _values[key] += 1;
  };

  this.increaseBy = function increaseBy(key, value) {
    if (_values[key] === undefined
        || typeof _values[key] !== 'number') {
      return;
    }
    _values[key] += value;
  };

  this.set = function set(key, value) {
    _values[key] = value;
  };

  this.add = function add(key, value) {
    if (_values[key] === undefined
        || !Array.isArray(_values[key])) {
      return;
    }
    _values[key].push(value);
  };

  this.get = function get(key) {
    return _values[key];
  };
}

module.exports = Profiler;
