const Resolutor = require('./Resolutor');
const Value = require('./Value');

let assertIsValue = function assertIsValue(val) {
  if (!(val instanceof Value)) {
    throw new Error('');
  }
};

function BuiltInFunctorProvider(context) {
  let functors = {
    '+/2': (v1, v2) => {
      assertIsValue(v1);
      assertIsValue(v2);

      return v1.evaluate() + v2.evaluate();
    },
    '-/2': (v1, v2) => {
      assertIsValue(v1);
      assertIsValue(v2);

      return v1.evaluate() - v2.evaluate();
    },
    '!/1': (literal) => {
      // v1 is a literal
      let queryResult = Resolutor.query(context, literal, []);
      return queryResult.length === 0;
    }
  };

  this.has = function has(id) {
    return functors[id] !== undefined;
  }

  this.execute = function execute(id, args) {
    if (functors[id] === undefined) {
      throw new Error('');
    }

    return functors[id].apply(null, args);
  };
};


module.exports = BuiltInFunctorProvider;
