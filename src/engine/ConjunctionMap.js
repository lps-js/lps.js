/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');

/**
 * Maps conjunctions to a value.
 * @constructor
 */
function ConjunctionMap() {
  let _conjunctions = [];

  /**
   * Add a mapping of a conjunction to a value to this map.
   * @param {Array} conjunction The conjunction to map the value
   * @param {any} value       The value to be mapped
   */
  this.add = function add(conjunction, value) {
    if (value === undefined) {
      return;
    }
    let map = new LiteralTreeMap();
    conjunction.forEach((conjunct) => {
      map.add(conjunct);
    });
    _conjunctions.push([map.size(), map, value]);
  };

  /**
   * Get the value of a conjunction.
   * @return {any} Return the value of the conjunction mapped if it exists. Otherwise if the
   *    conjunction is not mapped then undefined would be returned instead.
   */
  this.get = function get(conjunction) {
    let result;
    for (let i = 0; i < _conjunctions.length; i += 1) {
      let pair = _conjunctions[i];
      let containMismatch = false;
      if (conjunction.length !== pair[0]) {
        continue;
      }
      for (let j = 0; j < conjunction.length; j += 1) {
        let conjunct = conjunction[j];
        if (!pair[1].contains(conjunct)) {
          containMismatch = true;
          break;
        }
      }
      if (!containMismatch) {
        result = pair[2];
        break;
      }
    }
    return result;
  };
}

module.exports = ConjunctionMap;
