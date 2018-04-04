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

  this.isQuery = function isQuery() {
    return _head.length === 0;
  };

  this.isEmpty = function isEmpty() {
    return _head.length === 0 && _body.length === 0;
  };

  this.getHeadLiteralsCount = function getHeadLiteralsCount() {
    return _head.length;
  };

  this.getBodyLiteralsCount = function getBodyLiteralsCount() {
    return _body.length;
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
