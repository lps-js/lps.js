function Functor(name, args) {
  let _name = name;
  let _args = args;
  let _argsCount = args.length;

  this.getId = function getId() {
    return _name + '/' + _argsCount;
  };

  this.getVariables = function getVariables() {
    let hash = {};

    _args.forEach((arg) => {
      arg.getVariables().forEach((argVar) => {
        hash[argVar] = true;
      });
    });

    return Object.keys(hash);
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
    return [].concat(_args);
  };

  this.substitute = function substitute(theta) {
    let newArgs = _args.map(arg => arg.substitute(theta));
    return new Functor(_name, newArgs);
  };
}

module.exports = Functor;
