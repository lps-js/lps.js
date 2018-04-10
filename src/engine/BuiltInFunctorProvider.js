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

      return v1.evaluate() + v2.evaluate();
    },

    '-/2': function (v1, v2) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return v1.evaluate() - v2.evaluate();
    },

    '-/1': function (v1) {
      let v1 = resolveValue(v1Arg);
      assertIsValue(v1);
      return -v1.evaluate();
    },

    '>/2': function (v1, v2) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return v1.evaluate() > v2.evaluate();
    },

    '>=/2': function (v1, v2) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return v1.evaluate() >= v2.evaluate();
    },

    '</2': function (v1, v2) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);

      return v1.evaluate() < v2.evaluate();
    },

    '<=/2': function (v1, v2) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);
      return v1.evaluate() <= v2.evaluate();
    },

    '!=/2': function (v1, v2) {
      let v1 = resolveValue(v1Arg);
      let v2 = resolveValue(v2Arg);
      assertIsValue(v1);
      assertIsValue(v2);
      return v1.evaluate() != v2.evaluate();
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
