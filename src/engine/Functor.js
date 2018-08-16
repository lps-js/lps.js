function Functor(name, args) {
  let _name = name;
  let _args = args;
  let _argsCount = 0;

  if (typeof _args === 'undefined') {
    _args = [];
  } else {
    _argsCount = args.length;
  }

  this.getName = function getName() {
    return _name;
  };

  this.getId = function getId() {
    return _name + '/' + _argsCount;
  };

  this.evaluate = function evaluate() {
    return this.toString();
  };

  this.getGoal = function getGoal() {
    return this;
  };

  this.getArgumentCount = function getArgumentCount() {
    return _argsCount;
  };

  this.getVariables = function getVariables() {
    return Object.keys(this.getVariableHash());
  };

  this.getVariableHash = function getVariableHash(existingHash) {
    let hash = existingHash;
    if (hash === undefined) {
      hash = {};
    }

    _args.forEach((arg) => {
      arg.getVariableHash(hash);
    });

    return hash;
  };

  this.isGround = function isGround() {
    let result = true;

    for (let i = 0; i < _argsCount; i += 1) {
      let arg = _args[i];
      if (!arg.isGround()) {
        result = false;
        break;
      }
    }

    return result;
  };

  this.getArguments = function getArguments() {
    // content of _args is immutable
    return _args.concat([]);
  };

  this.substitute = function substitute(theta) {
    let newArgs = _args.map((arg) => {
      return arg.substitute(theta);
    });
    return new Functor(_name, newArgs);
  };

  this.toString = function toString() {
    let result = _name;
    if (_argsCount > 0) {
      result += '(';
      for (let i = 0; i < _argsCount; i += 1) {
        result += _args[i].toString();
        if (i < _argsCount - 1) {
          result += ', ';
        }
      }
      result += ')';
    }
    return result;
  };
}

module.exports = Functor;
