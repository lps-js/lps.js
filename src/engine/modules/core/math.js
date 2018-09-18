/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const resolveValue = lpsRequire('engine/modules/core/resolveValue');
const assertIsValue = lpsRequire('engine/modules/core/assertIsValue');
const returnResults = lpsRequire('engine/modules/core/returnResults');
const singleReplacementArray = returnResults.singleReplacementArray;

const STRING_TYPE = 'string';

const functors = {
  '+/2': function (v1Arg, v2Arg) {
    const selfFuncName = '+/2';
    let result = [];

    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }
    assertIsValue(v1);
    assertIsValue(v2);

    let v1Value = v1.evaluate();
    let v2Value = v2.evaluate();

    if (typeof v1Value === STRING_TYPE || typeof v2Value === STRING_TYPE) {
      // string concatenation
      let strResultValue = new Value(String(v1Value) + String(v2Value));
      return singleReplacementArray(strResultValue);
    }

    let numResultValue = new Value(Number(v1Value) + Number(v2Value));
    return singleReplacementArray(numResultValue);
  },

  '-/2': function (v1Arg, v2Arg) {
    const selfFuncName = '-/2';
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }
    assertIsValue(v1);
    assertIsValue(v2);

    const opResult = new Value(Number(v1.evaluate()) - Number(v2.evaluate()));
    return singleReplacementArray(opResult);
  },

  '*/2': function (v1Arg, v2Arg) {
    const selfFuncName = '*/2';
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }
    assertIsValue(v1);
    assertIsValue(v2);

    const opResult = new Value(Number(v1.evaluate()) * Number(v2.evaluate()));
    return singleReplacementArray(opResult);
  },

  '//2': function (v1Arg, v2Arg) {
    const selfFuncName = '//2';
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);

    const opResult = new Value(Number(v1.evaluate()) / Number(v2.evaluate()));
    return singleReplacementArray(opResult);
  },

  'mod/2': function (v1Arg, v2Arg) {
    const selfFuncName = 'mod/2';
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);

    const opResult = new Value(Number(v1.evaluate()) % Number(v2.evaluate()));
    return singleReplacementArray(opResult);
  },

  '**/2': function (v1Arg, v2Arg) {
    const selfFuncName = '**/2';
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);

    const opResult = new Value(Math.pow(Number(v1.evaluate()), Number(v2.evaluate())));
    return singleReplacementArray(opResult);
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

    const opResult = new Value(-Number(v1.evaluate()));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.abs(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.sin(v1.evaluate()));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.asin(v1.evaluate()));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.cos(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.acos(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.tan(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.atan(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.sqrt(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.max(Number(v1.evaluate()), Number(v2.evaluate())));
    return singleReplacementArray(opResult);
  },

  'min/2': function (v1Arg, v2Arg) {
    const selfFuncName = 'min/2';
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors[selfFuncName].call(this, v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);
    const opResult = new Value(Math.min(Number(v1.evaluate()), Number(v2.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.exp(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.log(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.log2(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.floor(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.ceil(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
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
    const opResult = new Value(Math.round(Number(v1.evaluate())));
    return singleReplacementArray(opResult);
  },

  'random/0': function () {
    const opResult = new Value(Math.random());
    return singleReplacementArray(opResult);
  },

  'randomInt/2': function (v1Arg, v2Arg) {
    const selfFuncName = 'randomInt/2';
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((v) => {
        result = result.concat(functors[selfFuncName].call(this, v, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((v) => {
        result = result.concat(functors[selfFuncName].call(this, v1, v));
      });
      return result;
    }

    if (v1.evaluate() > v2.evaluate()) {
      return functors[selfFuncName].call(this, v2, v1);
    }
    assertIsValue(v1);
    assertIsValue(v2);

    const randInt = Math.random() * (v2.evaluate() - v1.evaluate()) + v1.evaluate();
    const opResult = new Value(Math.round(randInt));
    return singleReplacementArray(opResult);
  },

  'pi/0': function () {
    const opResult = new Value(Math.PI);
    return singleReplacementArray(opResult);
  }

};

module.exports = functors;
