/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const Value = lpsRequire('engine/Value');
const Functor = lpsRequire('engine/Functor');

module.exports = function assertIsValue(val) {
  if (!(val instanceof Value) && !(val instanceof Functor)) {
    throw new Error('Must be value, ' + val + ' given');
  }
};
