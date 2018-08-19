/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const List = lpsRequire('engine/List');
const resolveValue = lpsRequire('engine/modules/core/resolveValue');
const assertIsValue = lpsRequire('engine/modules/core/assertIsValue');

const assertIsList = function assertIsList(val) {
  if (!(val instanceof List)) {
    throw new Error('Must be list');
  }
};

const functors = {
  'append/2': function (v1Arg, v2Arg) {
    let v1 = resolveValue.call(this, v1Arg);
    let v2 = resolveValue.call(this, v2Arg);
    assertIsList(v1);
    assertIsList(v2);

    let newListArr = v1.flatten().concat(v2.flatten());
    let newList = new List(newListArr);

    return [
      {
        theta: {},
        replacement: newList
      }
    ];
  },

  'length/1': function (v1Arg) {
    let v1 = resolveValue.call(this, v1Arg);

    assertIsList(v1);

    let value = new Value(v1.flatten().length);
    return [
      {
        theta: {},
        replacement: value
      }
    ];
  },

  'member/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['member/2'].call(this, instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    assertIsList(v2);
    let flattenedList = v2.flatten();
    if (v1 instanceof Variable) {
      let variableName = v1.evaluate();
      for (let i = 0; i < flattenedList.length; i += 1) {
        let theta = {};
        theta[variableName] = flattenedList[i];
        result.push({
          theta: theta
        });
      }
      return result;
    }

    assertIsValue(v1);
    for (let i = 0; i < flattenedList.length; i += 1) {
      if (flattenedList[i].evaluate() === v1.evaluate()) {
        // found an instance
        result.push({
          theta: {}
        });
      }
    }

    return result;
  }
};
module.exports = functors;
