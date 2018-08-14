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
};;
