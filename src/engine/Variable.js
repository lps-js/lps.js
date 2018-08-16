/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

/**
 * A variable data representation
 * @param       {string} name Name of the variable
 * @constructor
 */
function Variable(name) {
  let _name = name;

  /**
   * Evaluate and return the result of evaluation
   * @return {string} Return the name of the variable
   */
  this.evaluate = function evaluate() {
    return _name;
  };

  /**
   * Determine if the term is ground
   * @return {Boolean} Return false all the time
   */
  this.isGround = function isGround() {
    return false;
  };

  /**
   * Get all unique variables that occur in this term
   * @return {Array} Return an array with the variable's name as the only element.
   */
  this.getVariables = function getVariables() {
    return [_name];
  };

  this.getVariableHash = function getVariableHash(existingHash) {
    let hash = existingHash;
    if (hash === undefined) {
      hash = {};
    }

    hash[_name] = true;

    return hash;
  };

  /**
   * Perform a substitution on this term.
   * @param  {Object} theta The substitution theta
   * @return {any}       Return the substituted value if the variable name
   *  exists in the substitution theta, otherwise return a copy of the variable name
   */
  this.substitute = function substitute(theta) {
    if (name in theta) {
      // needs to be substituted
      return theta[name];
    }
    return new Variable(_name);
  };

  /**
   * Get a string representation of this term
   * @return {string} Return the variable's name
   */
  this.toString = function toString() {
    return _name;
  };
}

module.exports = Variable;
