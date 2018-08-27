/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const List = lpsRequire('engine/List');
const Value = lpsRequire('engine/Value');
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
  },

  /**
   * Check if a given term is a number
   * @param  {Object} operand The term data representation
   * @return {Array}         Predicate operation result
   * @version 1.0.2
   */
  'is_number/1': function (operand) {
    let result = [];
    if (operand instanceof Value
        && typeof operand.evaluate() === 'number') {
      result.push({ theta: {} });
    }
    return result;
  },

  /**
   * Check if a given term is numeric and is an integer
   * @param  {Object} operand The term data representation
   * @return {Array}         Predicate operation result
   * @version 1.0.2
   */
  'is_integer/1': function (operand) {
    let result = [];
    if (operand instanceof Value
        && Number.isInteger(operand.evaluate())) {
      result.push({ theta: {} });
    }
    return result;
  },

  /**
   * Check if a given term is numeric and is a float
   * @param  {Object} operand The term data representation
   * @return {Array}         Predicate operation result
   * @version 1.0.2
   */
  'is_float/1': function (operand) {
    let result = [];
    if (operand instanceof Value
        && Number(operand.evaluate()) === operand.evaluate()
        && operand.evaluate() % 1 !== 0) {
      result.push({ theta: {} });
    }
    return result;
  },

  'atom_number/1': function (operand) {
    let convertedNumber = Number(operand.evaluate());
    if (Number.isNaN(convertedNumber)) {
      // NaN check required
      return [];
    }
    let result = [
      {
        theta: {},
        replacement: new Value(convertedNumber)
      }
    ];
    return result;
  },

  'atom_string/1': function (operand) {
    let result = [
      {
        theta: {},
        replacement: new Value(String(operand.evaluate()))
      }
    ];
    return result;
  }
};
module.exports = functors;
