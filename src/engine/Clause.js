const Unifier = require('./Unifier');
const BooleanBinaryOperator = require('./BooleanBinaryOperator');
const BooleanUnaryOperator = require('./BooleanUnaryOperator');

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
    let theta = {};
    let unresolvedHeadLiterals = [];
    _head.forEach((literal) => {
      let newTheta = Unifier.unifies([[fact, literal]], theta);
      if (newTheta === null) {
        // unable to unify, let's just add to unresolvedHeadLiterals
        unresolvedHeadLiterals.push(literal);
      } else {
        theta = newTheta;
      }
    });

    if (unresolvedHeadLiterals.length === _head.length) {
      // nothing got resolved, probably not a matching rule.
      return null;
    }

    // perform substitution here
    unresolvedHeadLiterals = unresolvedHeadLiterals.map((literal) => {
      return literal.substitute(theta);
    });

    // perform head check
    for (let i = 0; i < unresolvedHeadLiterals.length; i += 1) {
      let literal = unresolvedHeadLiterals[i];
      if ((literal instanceof BooleanBinaryOperator
            || literal instanceof BooleanUnaryOperator)
          && literal.isGround() && !literal.evaluate()) {
        // nope this doesn't work out
        return null;
      }
    }

    let newBody = _body.map(expressions => expressions.substitute(theta));
    return new Clause(unresolvedHeadLiterals, newBody);
  };
}

module.exports = Clause;
