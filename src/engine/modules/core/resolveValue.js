/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const Functor = lpsRequire('engine/Functor');

/**
 * Resolve a value against the functor provider if it's a functor.
 * An instanceo of FunctorProvider must be passed in as "this" to
 * this function.
 * @param  {any} value The value to resolve
 * @return {any}       The resolved value
 */
module.exports = function resolveValue(value) {
  let result = value;
  if (result instanceof Functor && this.has(result.getId())) {
    let executionResult = this.execute(result);
    result = [];
    executionResult.forEach((r) => {
      if (r.replacement === undefined) {
        return;
      }
      result.push(r.replacement);
    });
  }
  return result;
};
