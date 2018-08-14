const Value = lpsRequire('engine/Value');
const Functor = lpsRequire('engine/Functor');

module.exports = function assertIsValue(val) {
  if (!(val instanceof Value) && !(val instanceof Functor)) {
    throw new Error('Must be value, ' + val + ' given');
  }
};
