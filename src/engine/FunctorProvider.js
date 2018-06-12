const Functor = require('./Functor');
const List = require('./List');
const Value = require('./Value');
const Variable = require('./Variable');

const functorIdentifierRegex = /^[a-zA-Z_0-9]+\/[1-9][0-9]*$/;

let assertIsValue = function assertIsValue(val) {
  if (!(val instanceof Value)) {
    throw new Error('Must be value');
  }
};

let assertIsList = function assertIsList(val) {
  if (!(val instanceof List)) {
    throw new Error('Must be list');
  }
};

function FunctorProvider(program) {
  let _customFunctors = {};

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
    return result;
  };

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

      // eslint-disable-next-line eqeqeq
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
      let v1 = resolveValue(v1Arg);

      assertIsList(v1);

      let value = new Value(v1.flatten().length);
      return checkOrSetOutputArg(value, v2Arg);
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

    '=/2': function (lhs, rhs) {
      if (!(lhs instanceof Variable)) {
        throw new Error('LHS of variable assignment must be a variable. ' + lhs + ' given instead.');
      }

      let result = [];
      let resolvedRHS = resolveValue(rhs);
      if (resolvedRHS instanceof Array) {
        resolvedRHS.forEach((instance) => {
          result = result.concat(functors['=/2'](lhs, instance));
        });
        return result;
      }
      let theta = {};
      theta[lhs.evaluate()] = resolvedRHS;
      result.push({
        theta: theta
      });
      return result;
    },

    '!/1': function (literal) {
      if (!(literal instanceof Functor)) {
        throw new Error('Literal not functor');
      }
      let queryResult = program.query(literal);
      let result = [];
      if (queryResult.length === 0) {
        result.push({
          theta: {}
        });
      }
      return result;
    }
  };

  this.define = function define(name, func) {
    if (name === '' || (typeof name !== 'string')) {
      throw new Error('Invalid name given for functor definition');
    }

    let functorId = name;
    if (functorId.indexOf('/') === -1) {
      let arity = func.length;
      functorId += '/' + arity;
    }

    if (!functorIdentifierRegex.test(functorId)) {
      throw new Error('Invalid name given for functor definition');
    }

    // customFunctors contain array of definitions for each functorId
    if (_customFunctors[functorId] === undefined) {
      _customFunctors[functorId] = [];
    }
    _customFunctors[functorId].push(func);
  };

  this.has = function has(literal) {
    let functorId = literal;
    if (literal instanceof Functor) {
      functorId = literal.getId();
    }
    if (functors[functorId] !== undefined) {
      return true;
    }
    // customFunctors contain array of definitions for each functorId
    return _customFunctors[functorId] !== undefined
      && _customFunctors[functorId].length > 0;
  };

  this.execute = function execute(literal) {
    let functorId = literal.getId();
    let functorArgs = literal.getArguments();

    let hasExecution = false;
    // combine results
    let result = [];
    if (functors[functorId] !== undefined) {
      hasExecution = true;
      result = result.concat(functors[functorId].apply(null, functorArgs));
    }
    if (_customFunctors[functorId] !== undefined) {
      hasExecution = true;
      // customFunctors contain array of definitions for each functorId
      _customFunctors[functorId].forEach((handler) => {
        // combine results together
        result = result.concat(handler.apply(null, functorArgs));
      });
    }
    if (!hasExecution) {
      // no definition for functor found.
      throw new Error('Call to undefined functor "' + functorId + '"');
    }
    return result;
  };
}


module.exports = FunctorProvider;
