const List = lpsRequire('engine/List');

const functors = {
  'is_ground/1': function (term) {
    let result = [];
    if (term.isGround !== undefined
        && term.isGround()) {
      result.push({ theta: {} });
    }
    return result;
  },

  'is_list/1': function (operand) {
    let result = [];
    if (operand instanceof List) {
      result.push({ theta: {} });
    }
    return result;
  }
};
module.exports = functors;
