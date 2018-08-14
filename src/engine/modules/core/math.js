const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const resolveValue = lpsRequire('engine/modules/core/resolveValue');
const assertIsValue = lpsRequire('engine/modules/core/assertIsValue');
const checkOrSetOutputArg = lpsRequire('engine/modules/core/checkOrSetOutputArg');

const functors = {
  '+/2': function (v1Arg, v2Arg) {
    let result = [];

    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['+/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['+/2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }
    assertIsValue(v1);
    assertIsValue(v2);

    return [
      {
        theta: {},
        replacement: new Value(Number(v1.evaluate()) + Number(v2.evaluate()))
      }
    ];
  },

  '-/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['-/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['-/2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }
    assertIsValue(v1);
    assertIsValue(v2);

    return [
      {
        theta: {},
        replacement: new Value(Number(v1.evaluate()) - Number(v2.evaluate()))
      }
    ];
  },

  '*/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['*/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['*/2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }
    assertIsValue(v1);
    assertIsValue(v2);

    return [
      {
        theta: {},
        replacement: new Value(Number(v1.evaluate()) * Number(v2.evaluate()))
      }
    ];
  },

  '//2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['//2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['//2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);

    return [
      {
        theta: {},
        replacement: new Value(Number(v1.evaluate()) / Number(v2.evaluate()))
      }
    ];
  },

  '**/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['**/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['**/2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);

    return [
      {
        theta: {},
        replacement: new Value(Math.pow(Number(v1.evaluate()), Number(v2.evaluate())))
      }
    ];
  },

  '-/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['-/1'](instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);

    return [
      {
        theta: {},
        replacement: new Value(-Number(v1.evaluate()))
      }
    ];
  },

  'abs/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['abs/1'](instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    let value = new Value(Math.abs(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'abs/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['abs/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.abs(Number(v1.evaluate())));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  },

  'sin/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['sin/1'](instance));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.sin(v1.evaluate()));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'sin/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['sin/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.sin(v1.evaluate()));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  },

  'cos/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['cos/1'](instance));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.cos(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'cos/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['cos/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.cos(v1.evaluate()));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  },

  'tan/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['tan/1'](instance));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.tan(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'tan/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['tan/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.tan(v1.evaluate()));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  },

  'sqrt/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['sqrt/1'](instance));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.sqrt(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'sqrt/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['sqrt/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.sqrt(v1.evaluate()));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  },

  'pow/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['pow/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['pow/2'](v1, instance));
      });
      return result;
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let value = new Value(Math.pow(Number(v1.evaluate()), Number(v2.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'pow/3': function (v1Arg, v2Arg, v3Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['pow/3'](instance, v2Arg, v3Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['pow/3'](v1, instance, v3Arg));
      });
      return result;
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let value = new Value(Math.pow(Number(v1.evaluate()), Number(v2.evaluate())));

    return checkOrSetOutputArg.call(this, value, v3Arg);
  },

  'max/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['max/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['max/2'](v1, instance));
      });
      return result;
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let value = new Value(Math.max(Number(v1.evaluate()), Number(v2.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'min/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['min/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['min/2'](v1, instance));
      });
      return result;
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let value = new Value(Math.min(Number(v1.evaluate()), Number(v2.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'exp/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['exp/1'](instance));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.exp(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'exp/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['exp/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.exp(v1.evaluate()));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  },

  'log/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['log/1'](instance));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.log(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'log/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['log/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.log(v1.evaluate()));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  },

  'floor/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['floor/1'](instance));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.floor(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'floor/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['floor/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.floor(v1.evaluate()));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  },

  'ceil/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['ceil/1'](instance));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.ceil(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'ceil/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['ceil/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.ceil(v1.evaluate()));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  },

  'round/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['round/1'](instance));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.round(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'round/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['round/2'](instance, v2Arg));
      });
      return result;
    }

    assertIsValue(v1);
    let value = new Value(Math.round(v1.evaluate()));

    return checkOrSetOutputArg.call(this, value, v2Arg);
  }

};

module.exports = functors;
