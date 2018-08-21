/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

/**
 * A generic clause representation
 * @param       {Array} head The head literals of the clause
 * @param       {Array} body The body literals of the clause
 * @constructor
 */
function Clause(head, body) {
  // array of expressions
  let _head = head;
  let _body = body;

  /**
   * Get all variables that occur in this clause
   * @return {Array} Return an array of unique variables that occur in this clause
   */
  this.getVariables = function getVariables() {
    let hash = {};

    let addLiteralToHash = (literal) => {
      literal.getVariables().forEach((litVar) => {
        hash[litVar] = true;
      });
    };

    _head.forEach(addLiteralToHash);
    _body.forEach(addLiteralToHash);

    return Object.keys(hash);
  };

  /**
   * Determine if the clause is a constraint clause
   * @return {Boolean} Return true if the clause is a constraint (i.e. no head literals),
   *    false otherwise.
   */
  this.isConstraint = function isConstraint() {
    return _head.length === 0;
  };

  /**
   * Get the number of head literals in this clause
   * @return {number} Return the number of head literals
   */
  this.getHeadLiteralsCount = function getHeadLiteralsCount() {
    return _head.length;
  };

  /**
   * Get the number of body literals in this clause
   * @return {number} Return the number of body literals
   */
  this.getBodyLiteralsCount = function getBodyLiteralsCount() {
    return _body.length;
  };

  /**
   * Determine if the clause is ground or not
   * @return {Boolean} Return true if the clause is ground, false otherwise.
   */
  this.isGround = function isGround() {
    for (let i = 0; i < _head.length; i += 1) {
      let literal = _head[i];
      if (!literal.isGround()) {
        return false;
      }
    }

    for (let i = 0; i < _body.length; i += 1) {
      let literal = _body[i];
      if (!literal.isGround()) {
        return false;
      }
    }

    return true;
  };

  /**
   * Perform substitution on all terms in the clause
   * and return a substituted copy of the clause.
   * @param  {Object} theta The substitution theta
   * @return {Clause}       Return a copy of the substituted clause
   */
  this.substitute = function substitute(theta) {
    let newHead = _head.map(expressions => expressions.substitute(theta));
    let newBody = _body.map(expressions => expressions.substitute(theta));
    return new Clause(newHead, newBody);
  };

  /**
   * Get the head literals in the clause
   * @return {Array} Return a shallow copy of the head literals in the clause
   */
  this.getHeadLiterals = function getHeadLiterals() {
    return _head.concat();
  };

  /**
   * Get the body literals in the clause
   * @return {Array} Return a shallow copy of the body literals in the clause
   */
  this.getBodyLiterals = function getBodyLiterals() {
    return _body.concat();
  };

  /**
   * Get a string representation of the clause
   * @return {string} Return a string representation of the clause
   */
  this.toString = function toString() {
    let result = '';
    for (let i = 0; i < _head.length; i += 1) {
      result += _head[i].toString();
      if (i < _head.length - 1) {
        result += ', ';
      }
    }
    if (_body.length > 0) {
      if (_head.length > 0) {
        result += ' ';
      }
      result += '<- ';
    }
    if (_body.length === 0 && _head.length > 0) {
      result += ' <- true';
    }
    for (let i = 0; i < _body.length; i += 1) {
      result += _body[i].toString();
      if (i < _body.length - 1) {
        result += ', ';
      }
    }
    result += '.';
    return result;
  };
}

module.exports = Clause;
