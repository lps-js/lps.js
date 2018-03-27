const Unifier = require('./Unifier');
const BooleanBinaryOperator = require('./BooleanBinaryOperator');
const BooleanUnaryOperator = require('./BooleanUnaryOperator');
const variableArrayRename = require('../utility/variableArrayRename');

function Clause(head, body) {
  // array of expressions
  let _head = head;
  let _body = body;

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

  this.isFact = function isFact() {
    return _body.length === 0;
  };

  this.isGround = function isGround() {
    let result = true;

    for (let i = 0; i < _head.length; i += 1) {
      let literal = _head[i];
      if (!literal.isGround()) {
        result = false;
        break;
      }
    }

    if (!result) {
      return result;
    }

    for (let i = 0; i < _body.length; i += 1) {
      let literal = _body[i];
      if (!literal.isGround()) {
        result = false;
        break;
      }
    }

    return result;
  };

  this.substitute = function substitute(theta) {
    let newHead = _head.map(expressions => expressions.substitute(theta));
    let newBody = _body.map(expressions => expressions.substitute(theta));
    return new Clause(newHead, newBody);
  };

  this.getHeadLiterals = function getHeadLiterals() {
    return [].concat(_head);
  };

  this.getBodyLiterals = function getBodyLiterals() {
    return [].concat(_body);
  };

  this.resolve = function resolve(fact) {
    let substitutedFact = fact
      .substitute(variableArrayRename(fact.getVariables(), '$fv_*'));
    let theta = {};
    let unresolvedBodyLiterals = [];
    _body.forEach((literal) => {
      let newTheta = Unifier.unifies([[substitutedFact, literal]], theta);
      if (newTheta === null) {
        // unable to unify, let's just add to unresolvedBodyLiterals
        unresolvedBodyLiterals.push(literal);
      } else {
        theta = newTheta;
      }
    });

    if (unresolvedBodyLiterals.length === _body.length) {
      // nothing got resolved, probably not a matching rule.
      return null;
    }

    // perform substitution here
    unresolvedBodyLiterals = unresolvedBodyLiterals.map((literal) => {
      return literal.substitute(theta);
    });

    // perform head check
    for (let i = 0; i < unresolvedBodyLiterals.length; i += 1) {
      let literal = unresolvedBodyLiterals[i];
      if ((literal instanceof BooleanBinaryOperator
            || literal instanceof BooleanUnaryOperator)
          && literal.isGround() && !literal.evaluate()) {
        // nope this doesn't work out
        return null;
      }
    }

    let newHead = _head.map(expressions => expressions.substitute(theta));
    return new Clause(newHead, unresolvedBodyLiterals);
  };

  this.toString = function toString() {
    let result = '';
    for (let i = 0; i < _head.length; i += 1) {
      result += _head[i].toString();
      if (i < _head.length - 1) {
        result += ', ';
      }
    }
    if (_body.length > 0) {
      result += ' :- ';
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
