/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');

function dedupeConjunction(conjunction) {
  let map = new LiteralTreeMap();
  let result = [];
  conjunction.forEach((conjunct) => {
    if (map.contains(conjunct)) {
      return;
    }
    map.add(conjunct);
    result.push(conjunct);
  });
  return result;
}

module.exports = dedupeConjunction;
