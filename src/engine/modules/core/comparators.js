/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const Variable = lpsRequire('engine/Variable');
const resolveValue = lpsRequire('engine/modules/core/resolveValue');
const assertIsValue = lpsRequire('engine/modules/core/assertIsValue');

const functors = {
  '>/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['>/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['>/2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let num1 = Number(v1.evaluate());
    let num2 = Number(v2.evaluate());

    if (num1 > num2) {
      result.push({
        theta: {}
      });
    }
    return result;
  },

  '>=/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['>=/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['>=/2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let num1 = Number(v1.evaluate());
    let num2 = Number(v2.evaluate());

    if (num1 >= num2) {
      result.push({
        theta: {}
      });
    }
    return result;
  },

  '</2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['</2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['</2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let num1 = Number(v1.evaluate());
    let num2 = Number(v2.evaluate());

    if (num1 < num2) {
      result.push({
        theta: {}
      });
    }
    return result;
  },

  '<=/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['<=/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['<=/2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);

    let num1 = Number(v1.evaluate());
    let num2 = Number(v2.evaluate());

    if (num1 <= num2) {
      result.push({
        theta: {}
      });
    }
    return result;
  },

  '==/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['==/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['==/2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let num1 = v1.evaluate();
    let num2 = v2.evaluate();

    if (num1 === num2) {
      result.push({
        theta: {}
      });
    }
    return result;
  },

  '!=/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['!=/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['!=/2'](v1, instance));
      });
      return result;
    }

    if (v1 instanceof Variable || v2 instanceof Variable) {
      return [];
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let num1 = v1.evaluate();
    let num2 = v2.evaluate();

    // eslint-disable-next-line eqeqeq
    if (num1 != num2) {
      result.push({
        theta: {}
      });
    }
    return result;
  },

  '@</2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['@</2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['@</2'](v1, instance));
      });
      return result;
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let compareResult = String(v1.evaluate()).localeCompare(String(v2.evaluate()));

    if (compareResult === -1) {
      result.push({
        theta: {}
      });
    }
    return result;
  },

  '@=/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['@=/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['@=/2'](v1, instance));
      });
      return result;
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let compareResult = String(v1.evaluate()).localeCompare(String(v2.evaluate()));

    if (compareResult === 0) {
      result.push({
        theta: {}
      });
    }
    return result;
  },

  '@>/2': function (v1Arg, v2Arg) {
    let result = [];
    let v1 = resolveValue.call(this, v1Arg);
    if (v1 instanceof Array) {
      v1.forEach((instance) => {
        result = result.concat(functors['@>/2'](instance, v2Arg));
      });
      return result;
    }

    let v2 = resolveValue.call(this, v2Arg);
    if (v2 instanceof Array) {
      v2.forEach((instance) => {
        result = result.concat(functors['@>/2'](v1, instance));
      });
      return result;
    }

    assertIsValue(v1);
    assertIsValue(v2);
    let compareResult = String(v1.evaluate()).localeCompare(String(v2.evaluate()));

    if (compareResult === 1) {
      result.push({
        theta: {}
      });
    } // else result remains an empty array
    return result;
  }
};
module.exports = functors;
