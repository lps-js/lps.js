const Functor = require('./Functor');
const List = require('./List');
const Value = require('./Value');
const Variable = require('./Variable');

let assertIsValue = function assertIsValue(val) {
  if (!(val instanceof Value)) {
    throw new Error('');
  }
};

let assertIsList = function assertIsList(val) {
  if (!(val instanceof List)) {
    throw new Error('');
  }
};

function BuiltInFunctorProvider(findUnifications) {
  let resolveValue = (v) => {
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
    // } else if (result instanceof List) {
    //   let flattenedList = v.flatten();
    //   result = [];
    //   let recursivelyBuildInstancesOfList = function (listSoFar, idx) {
    //     if (idx >= flattenedList.length) {
    //       result.push(new List(listSoFar));
    //       return;
    //     }
    //     let element = flattenedList[idx];
    //     let resolved = resolveValue(element);
    //     if (resolved instanceof Array) {
    //       resolved.forEach((instance) => {
    //         if (instance.replacement === undefined) {
    //           return;
    //         }
    //         recursivelyBuildInstancesOfList(listSoFar.concat([instance.replacement]), idx + 1);
    //       });
    //       return;
    //     }
    //     let newListSoFar = listSoFar.concat([resolved]);
    //     recursivelyBuildInstancesOfList(newListSoFar, idx + 1);
    //   };
    //   recursivelyBuildInstancesOfList([], 0);
    // }
    return result;
  }

  let checkOrSetOutputArg = function checkOrSetOutputArg(value, outputArg) {
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
    let output = resolveValue(outputArg);

    if (output instanceof Array) {
      output.forEach((instance) => {
        result = result.concat(checkOrSetOutputArg(value, instance));
      });
      return result;
    }

    if (value instanceof List && !(output instanceof List)) {
      return result;
    }

    if (value instanceof List && output instanceof List) {
      let flattenedValueList = value.flatten();
      let flattenedOutputList = output.flatten();
      if (flattenedValueList.length != flattenedOutputList.length) {
        return result;
      }

      for (let i = 0; i < flattenedValueList.length; i += 1) {

      }

      result.push(
        {
          theta: {}
        }
      );
    } else if (value.evaluate() === output.evaluate()) {
      result.push(
        {
          theta: {}
        }
      );
    }
    return result;
  };

  let functors = {
    '+/2': function (v1Arg, v2Arg) {
      let result = [];

      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['+/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['+/2'](v1, instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['-/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['-/2'](v1, instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['*/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['*/2'](v1, instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['//2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['//2'](v1, instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['**/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['**/2'](v1, instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['-/1'](instance));
        });
        return result;
      }

      assertIsValue(v1);

      return [
        {
          theta: {},
          replacement: new Value(-Number(v1.evaluate()))
        }
      ];
    },

    '>/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['>/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['>/2'](v1, instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['>=/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['>=/2'](v1, instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['</2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['</2'](v1, instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['<=/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['<=/2'](v1, instance));
        });
        return result;
      }

      if (v1 instanceof Variable) {
        result.push({
          theta: {},
          replacement: new Functor('<=/2', [v1, v2])
        });
        return result;
      }

      if (v2 instanceof Variable) {
        result.push({
          theta: {},
          replacement: new Functor('<=/2', [v1, v2])
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['==/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['==/2'](v1, instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['!=/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['!=/2'](v1, instance));
        });
        return result;
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let num1 = v1.evaluate();
      let num2 = v2.evaluate();

      if (num1 != num2) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    'abs/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['abs/1'](instance));
        });
        return result;
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['abs/2'](instance, v2Arg));
        });
        return result;
      }

      assertIsValue(v1);
      let value = new Value(Math.abs(Number(v1.evaluate())));

      return checkOrSetOutputArg(value, v2Arg);
    },

    'sin/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['sin/2'](instance, v2Arg));
        });
        return result;
      }

      assertIsValue(v1);
      let value = new Value(Math.sin(v1.evaluate()));

      return checkOrSetOutputArg(value, v2Arg);
    },

    'cos/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['cos/2'](instance, v2Arg));
        });
        return result;
      }

      assertIsValue(v1);
      let value = new Value(Math.cos(v1.evaluate()));

      return checkOrSetOutputArg(value, v2Arg);
    },

    'tan/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['tan/1'](instance, v2Arg));
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['tan/2'](instance, v2Arg));
        });
        return result;
      }

      assertIsValue(v1);
      let value = new Value(Math.tan(v1.evaluate()));

      return checkOrSetOutputArg(value, v2Arg);
    },

    'sqrt/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['sqrt/2'](instance, v2Arg));
        });
        return result;
      }

      assertIsValue(v1);
      let value = new Value(Math.sqrt(v1.evaluate()));

      return checkOrSetOutputArg(value, v2Arg);
    },

    'pow/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['pow/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['pow/3'](instance, v2Arg, v3Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['pow/3'](v1, instance, v3Arg));
        });
        return result;
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let value = new Value(Math.pow(Number(v1.evaluate()), Number(v2.evaluate())));

      return checkOrSetOutputArg(value, v3Arg);
    },

    'max/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['max/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
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

    'max/3': function (v1Arg, v2Arg, v3Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['max/3'](instance, v2Arg, v3Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['max/3'](v1, instance, v3Arg));
        });
        return result;
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let value = new Value(Math.max(Number(v1.evaluate()), Number(v2.evaluate())));

      return checkOrSetOutputArg(value, v3Arg);
    },

    'min/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['min/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
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

    'min/3': function (v1Arg, v2Arg, v3Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['min/3'](instance, v2Arg, v3Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['min/3'](v1, instance, v3Arg));
        });
        return result;
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let value = new Value(Math.min(Number(v1.evaluate()), Number(v2.evaluate())));

      return checkOrSetOutputArg(value, v3Arg);
    },

    'exp/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['exp/2'](instance, v2Arg));
        });
        return result;
      }

      assertIsValue(v1);
      let value = new Value(Math.exp(v1.evaluate()));

      return checkOrSetOutputArg(value, v2Arg);
    },

    'log/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['log/2'](instance, v2Arg));
        });
        return result;
      }

      assertIsValue(v1);
      let value = new Value(Math.log(v1.evaluate()));

      return checkOrSetOutputArg(value, v2Arg);
    },

    'floor/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['floor/2'](instance, v2Arg));
        });
        return result;
      }

      assertIsValue(v1);
      let value = new Value(Math.floor(v1.evaluate()));

      return checkOrSetOutputArg(value, v2Arg);
    },

    'ceil/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['ceil/2'](instance, v2Arg));
        });
        return result;
      }

      assertIsValue(v1);
      let value = new Value(Math.ceil(v1.evaluate()));

      return checkOrSetOutputArg(value, v2Arg);
    },

    '@</2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['@</2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['@=/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
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
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['@>/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
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
    },

    'append/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
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

    'append/3': function (v1Arg, v2Arg, v3Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);

      let v2 = resolveValue(v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(functors['append/3'](v1, instance, v3Arg));
        });
        return result;
      }

      if (v1 instanceof Variable) {
        return [
          {
            theta: {},
            replacement: new Functor('append', [v1, v2, v3Arg])
          }
        ];
      }
      if (v2 instanceof Variable) {
        return [
          {
            theta: {},
            replacement: new Functor('append', [v1, v2, v3Arg])
          }
        ];
      }

      let newListArr = v1.flatten().concat(v2.flatten());
      let newList = new List(newListArr);

      return checkOrSetOutputArg(newList, v3Arg);
    },

    'length/1': function (v1Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);

      assertIsList(v1);

      let value = new Value(v1.flatten().length);

      return [
        {
          theta: {},
          replacement: value
        }
      ];
    },

    'length/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);

      assertIsList(v1);

      let value = new Value(v1.flatten().length);

      return checkOrSetOutputArg(newList, v2Arg);
    },

    'member/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue(v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(functors['member/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue(v2Arg);
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
    },

    '!/1': function (literal) {
      if (!(literal instanceof Functor)) {
        throw new Error('');
      }
      let queryResult = findUnifications(literal);
      let result = [];
      if (queryResult.length === 0) {
        result.push({
          theta: {}
        });
      }
      return result;
    }
  };

  this.has = function has(id) {
    return functors[id] !== undefined;
  }

  this.execute = function execute(literal) {
    let id = literal.getId()
    if (functors[id] === undefined) {
      throw new Error('');
    }
    return functors[id].apply(null, literal.getArguments());
  };
};


module.exports = BuiltInFunctorProvider;
