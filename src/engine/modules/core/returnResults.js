const TUPLE_THETA_KEY = 'theta';
const TUPLE_REPLACEMENT_KEY = 'replacement';

const singleReplacementArray = (result) => {
  const tuple = {};
  tuple[TUPLE_THETA_KEY] = {};
  tuple[TUPLE_REPLACEMENT_KEY] = result;
  return [tuple];
};

const createTheta = (result) => {
  const tuple = {};
  tuple[TUPLE_THETA_KEY] = {};
  if (result !== undefined) {
    tuple[TUPLE_THETA_KEY] = result;
  }
  return tuple;
};

module.exports = {
  singleReplacementArray: singleReplacementArray,
  createTheta: createTheta
};
