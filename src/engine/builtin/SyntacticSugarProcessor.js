const Functor = lpsRequire('engine/Functor');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');

function SyntacticSugarProcessor() {

}

SyntacticSugarProcessor.shorthand = function shorthand(termArg) {
  let term = termArg;
  if (term instanceof Functor && term.getId() === '//2') {
    let termArguments = term.getArguments();
    let name = termArguments[0];
    let arity = termArguments[1];
    if (name instanceof Functor && name.getArgumentCount() === 0 && arity instanceof Value) {
      name = name.evaluate();
      arity = arity.evaluate();
      let args = [];
      for (let i = 0; i < arity; i += 1) {
        args.push(new Variable('_' + i));
      }
      return new Functor(name, args);
    }
  }
  return term;
};

module.exports = SyntacticSugarProcessor;
