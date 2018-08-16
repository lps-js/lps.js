/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const List = lpsRequire('engine/List');
const Variable = lpsRequire('engine/Variable');

const functors = {
  'is_ground/1': function (term) {
    let result = [];

    if (term.isGround !== undefined
        && term.isGround()) {
      result.push({ theta: {} });
    }
    return result;
  },

  'is_variable/1': function (term) {
    let result = [];
    if (term instanceof Variable) {
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
