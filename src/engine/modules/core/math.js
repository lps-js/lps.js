/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const resolveValue = lpsRequire('engine/modules/core/resolveValue');
const assertIsValue = lpsRequire('engine/modules/core/assertIsValue');

const functors = {
  '+/2': function (v1Arg, v2Arg) {
    let result = [];

    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['+/2'].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['+/2'].call(this, v1, instance));
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
        result = result.concat(functors['-/2'].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['-/2'].call(this, v1, instance));
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
        result = result.concat(functors['*/2'].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['*/2'].call(this, v1, instance));
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
        result = result.concat(functors['//2'].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['//2'].call(this, v1, instance));
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

  'mod/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['mod/2'].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['mod/2'].call(this, v1, instance));
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
        replacement: new Value(Number(v1.evaluate()) % Number(v2.evaluate()))
      }
    ];
  },

  '**/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['**/2'].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['**/2'].call(this, v1, instance));
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
        result = result.concat(functors['-/1'].call(this, instance));
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
        result = result.concat(functors['abs/1'].call(this, instance));
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

  'sin/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['sin/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
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

  'asin/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['asin/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    let value = new Value(Math.asin(v1.evaluate()));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'cos/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['cos/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
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

  'acos/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['acos/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    let value = new Value(Math.acos(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'tan/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['tan/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
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

  'atan/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['atan/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    let value = new Value(Math.atan(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'sqrt/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['sqrt/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
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

  'pow/2': function (v1Arg, v2Arg) {
    return functors['**/2'].call(this, v1Arg, v2Arg);
  },

  'max/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['max/2'].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['max/2'].call(this, v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
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
        result = result.concat(functors['min/2'].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['min/2'].call(this, v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
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
        result = result.concat(functors['exp/1'].call(this, instance));
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

  'log/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['log/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
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

  'log2/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['log2/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    let value = new Value(Math.log2(Number(v1.evaluate())));

    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'floor/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['floor/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
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

  'ceil/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['ceil/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
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

  'round/1': function (v1Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['round/1'].call(this, instance));
      });
      return result;
    }

    if (v1 instanceof Variable) {
      return [];
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

  'random/0': function () {
    let value = new Value(Math.random());
    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'randomInt/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((v) => {
        result = result.concat(functors['randomInt/2'].call(this, v, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((v) => {
        result = result.concat(functors['randomInt/2'].call(this, v1, v));
      });
      return result;
    }

    if (v1.evaluate() > v2.evaluate()) {
      return functors['randomInt/2'].call(this, v2, v1);
    }
    assertIsValue(v1);
    assertIsValue(v2);

    let randInt = Math.random() * (v2.evaluate() - v1.evaluate()) + v1.evaluate();
    let value = new Value(Math.round(randInt));
    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'pi/0': function () {
    let value = new Value(Math.PI);
    return [
      {
        theta: {},
        replacement: value
      }
    ];
  }

};

module.exports = functors;
