const Functor = lpsRequire('engine/Functor');

module.exports = function resolveValue(v) {
  let result = v;
  if (result instanceof Functor && this.has(result.getId())) {
    let functorExecutionResult = this.execute(result);
    result = [];
    functorExecutionResult.forEach((r) => {
      if (r.replacement === undefined) {
        return;
      }
      result.push(r.replacement);
    });
  }
  return result;
};;
