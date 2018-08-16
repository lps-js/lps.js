/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

/**
 * A value data representation
 * @param       {(number|string)} value The actual value to be stored
 * @constructor
 */
function Value(value) {
  let _value = value;

  /**
   * Evaluate and return the result of evaluation
   * @return {(number|string)} Return the value stored
   */
  this.evaluate = function evaluate() {
    return _value;
  };

  /**
   * Determine if the term is ground
   * @return {Boolean} Return true all the time.
   */
  this.isGround = function isGround() {
    return true;
  };

  /**
   * Get all unique variables in the representation
   * @return {Array} Return empty array all the time.
   */
  this.getVariables = function getVariables() {
    return [];
  };

  this.getVariableHash = function getVariableHash() {
    return {};
  };

  /**
   * Perform a substitution on this term.
   * @param  {Object} theta The substitution theta
   * @return {Value} Return a copy of the value.
   */
  // eslint-disable-next-line no-unused-vars
  this.substitute = function substitute(theta) {
    return new Value(_value);
  };

  /**
   * Get the string representation of the value
   * @return {string} Return the string representation of the value.
   */
  this.toString = function toString() {
    let result = _value;
    if (typeof _value === 'string') {
      result = '"' + result.replace('"', '\\"') + '"';
    }
    return result;
  };
}

module.exports = Value;
