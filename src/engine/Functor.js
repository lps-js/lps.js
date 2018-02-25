function Functor(name, args) {
  let _name = name;
  let _args = args;
  let _argsCount = args.length;

  this.getId = function getId() {
    return _name + '/' + _argsCount;
  };

  this.getVariables = function getVariables() {
    let variables = [];
    let hash = {};

    _args.forEach((arg) => {
      arg.getVariables().forEach((argVar) => {
        hash[argVar] = true;
      });
    });

    return Object.keys(hash);
  };
}

module.exports = Functor;
