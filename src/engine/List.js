/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Variable = lpsRequire('engine/Variable');

/**
 * A list data representation
 * @param       {Array} head The head of the list
 * @param       {List|Variable} [tail] The tail of the list. If not defined,
 *    an empty list is considered to be the tail.
 * @constructor
 */
function List(head, tail) {
  let _head = head;
  let _tail = tail;
  let _variableHash = null;

  if (tail === undefined) {
    // empty list for tail
    _tail = null;
  }

  /**
   * Get the head of the list
   * @return {Array} Return the array representing the head of the list
   */
  this.getHead = function getHead() {
    return _head.concat([]);
  };

  /**
   * Get the tail of the list
   * @return {Array|List|Variable} Return the tail representation of the list
   */
  this.getTail = function getTail() {
    return _tail;
  };

  /**
   * Determine if the term is ground
   * @return {Boolean} Return true if the term is ground, false otherwise.
   */
  this.isGround = function isGround() {
    if (_tail !== null) {
      return _tail.isGround();
    }

    for (let i = 0; i < _head.length; i += 1) {
      if (!_head[i].isGround()) {
        return false;
      }
    }

    return true;
  };

  /**
   * Get all unique variables that occur in this term
   * @return {Array} Return the array of unique variables occuring in this term
   */
  this.getVariables = function getVariables() {
    return Object.keys(this.getVariableHash());
  };

  this.getVariableHash = function getVariableHash(existingHash) {
    let hash = existingHash;
    if (_variableHash !== null)  {
      if (hash === undefined) {
        return _variableHash;
      }
      Object.keys(_variableHash).forEach((v) => {
        hash[v] = true;
      });
      return hash;
    }

    // if we're writing into existing hash, don't store the hash
    if (hash === undefined) {
      hash = {};
    }
    let storedHash = {};

    const processArg = function processArg(arg) {
      arg.getVariableHash(storedHash);
      arg.getVariableHash(hash);
    };

    _head.forEach(processArg);

    if (_tail instanceof List) {
      processArg(_tail);
    } else if (_tail instanceof Variable) {
      storedHash[_tail.evaluate()] = true;
      hash[_tail.evaluate()] = true;
    }

    _variableHash = storedHash;
    return hash;
  };

  /**
   * Perform a substitution on this term.
   * @param  {Object} theta The substitution theta
   * @return {List}       Return the substituted list
   */
  this.substitute = function substitute(theta) {
    let newHead = head.map((element) => {
      return element.substitute(theta);
    });

    let newTail = _tail;
    if (newTail instanceof List || newTail instanceof Variable) {
      newTail = newTail.substitute(theta);
    }
    return new List(newHead, newTail);
  };

  /**
   * Create a flat representation of the list. If the tail of the list is a variable,
   * the empty list is assumed.
   * @return {Array} Return the flat array representation of the list
   */
  this.flatten = function flatten() {
    let result = [];
    if (_head.length > 0) {
      result = result.concat(_head);
      if (_tail instanceof List) {
        result = result.concat(_tail.flatten());
      }
    }
    return result;
  };

  /**
   * Determine if the list is empty
   * @return {Boolean} Return true if the list is empty, false otherwise.
   */
  this.isEmpty = function isEmpty() {
    return _head.length === 0
      && (_tail instanceof List && _tail.isEmpty());
  };

  /**
   * Create a string representation of the term
   * @return {string} Return the string representation of the term
   */
  this.toString = function toString() {
    let result = '';
    result += '[';
    for (let j = 0; j < _head.length; j += 1) {
      result += _head[j];
      if (j < _head.length - 1) {
        result += ', ';
      }
    }
    if (_tail !== null && (!(_tail instanceof List) || !_tail.isEmpty())) {
      result += '|' + _tail.toString();
    }
    result += ']';
    return result;
  };
}

module.exports = List;
