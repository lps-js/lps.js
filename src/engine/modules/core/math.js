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
};

module.exports = functors;
