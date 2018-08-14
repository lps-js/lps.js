const List = lpsRequire('engine/List');
const Variable = lpsRequire('engine/Variable');
const resolveValue = lpsRequire('engine/modules/core/resolveValue');

module.exports = function checkOrSetOutputArg(value, outputArg) {
  if (outputArg instanceof Variable) {
    let varName = outputArg.evaluate();
    let theta = {};
    theta[varName] = value;
    return [
      {
        theta: theta
      }
    ];
  }

  let result = [];
  let output = resolveValue.call(this, outputArg);

  if (output instanceof Array) {
    output.forEach((instance) => {
      result = result.concat(checkOrSetOutputArg.call(this, value, instance));
    });
    return result;
  }

  if (value instanceof List && !(output instanceof List)) {
    return result;
  }

  if (value instanceof List && output instanceof List) {
    let flattenedValueList = value.flatten();
    let flattenedOutputList = output.flatten();
    if (flattenedValueList.length !== flattenedOutputList.length) {
      return result;
    }

    result.push({
      theta: {}
    });
  } else if (value.evaluate() === output.evaluate()) {
    result.push({
      theta: {}
    });
  }
  return result;
};
