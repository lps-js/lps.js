/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const Value = lpsRequire('engine/Value');
const Functor = lpsRequire('engine/Functor');

/**
 * Throw an error if the given argument is not a value or nullary functor
 * @param  {any} val A given piece of data
 */
module.exports = function assertIsValue(val) {
  if (!(val instanceof Value)
      && !(val instanceof Functor && val.getArgumentCount() === 0)) {
    throw new Error('Must be value, ' + val + ' given');
  }
};
