const Functor = require('./Functor');
const Value = require('./Value');

let assertIsValue = function assertIsValue(val) {
  if (!(val instanceof Value)) {
    throw new Error('');
  }
};

function BuiltInFunctorProvider(findUnifications) {
  let resolveValue = (v) => {
    let result = v;
    if (result instanceof Functor && this.has(result.getId())) {
      result = this.execute(result);
    }
    return result;
  }

  let functors = {
    '+/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return new Value(Number(v1.evaluate()) + Number(v2.evaluate()));
    },

    '-/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return new Value(Number(v1.evaluate()) - Number(v2.evaluate()));
    },

    '*/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return new Value(Number(v1.evaluate()) * Number(v2.evaluate()));
    },

    '//2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return new Value(Number(v1.evaluate()) / Number(v2.evaluate()));
    },

    '**/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return new Value(Math.pow(Number(v1.evaluate()), Number(v2.evaluate())));
    },

    '-/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(-Number(v1.evaluate()));
    },

    '>/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return Number(v1.evaluate()) > Number(v2.evaluate());
    },

    '>=/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return Number(v1.evaluate()) >= Number(v2.evaluate());
    },

    '</2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return v1.evaluate() < v2.evaluate();
    },

    '<=/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return Number(v1.evaluate()) <= Number(v2.evaluate());
    },

    '!=/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return v1.evaluate() != v2.evaluate();
    },

    'abs/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(Math.abs(Number(v1.evaluate())));
    },

    'sin/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(Math.sin(v1.evaluate()));
    },

    'cos/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(Math.cos(Number(v1.evaluate())));
    },

    'tan/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(Math.tan(Number(v1.evaluate())));
    },

    'sqrt/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(Math.sqrt(Number(v1.evaluate())));
    },

    'pow/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);
      return new Value(Math.pow(Number(v1.evaluate()), Number(v2.evaluate())));
    },

    'max/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);
      return new Value(Math.max(Number(v1.evaluate()), Number(v2.evaluate())));
    },

    'min/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);
      return new Value(Math.min(Number(v1.evaluate()), Number(v2.evaluate())));
    },

    'exp/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(Math.exp(Number(v1.evaluate())));
    },

    'log/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(Math.log(Number(v1.evaluate())));
    },

    'floor/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(Math.floor(Number(v1.evaluate())));
    },

    'ceil/1': function (v1Arg) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return new Value(Math.ceil(Number(v1.evaluate())));
    },

    '@</2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return String(v1.evaluate()).localeCompare(String(v2.evaluate())) === -1;
    },

    '@=/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return String(v1.evaluate()).localeCompare(String(v2.evaluate())) === 0;
    },

    '@>/2': function (v1Arg, v2Arg) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return String(v1.evaluate()).localeCompare(String(v2.evaluate())) === 1;
    },

    '!/1': function (literal) {
      if (!(literal instanceof Functor)) {
        throw new Error('');
      }
      let queryResult = findUnifications(literal);
      return queryResult.length === 0;
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
