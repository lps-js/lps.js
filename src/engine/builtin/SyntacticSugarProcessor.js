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
}

SyntacticSugarProcessor.fluent = function fluent(literalArg, timingVariableArg) {
  let literal = literalArg;
  let timingVariable = timingVariableArg;
  if (timingVariable === undefined) {
    timingVariable = new Variable('$T');
  }
  if (literal instanceof Value) {
    literal = new Functor(literal.evaluate(), []);
  }
  if (!(literal instanceof Functor)) {
    throw new Error('Unexpected value "' + literal.toString() + '" provided for a literal.');
  }
  literal = new Functor(literal.getName(), literal.getArguments().concat([timingVariable]));
  return literal;
};

SyntacticSugarProcessor.action = function action(literalArg) {
  let literal = literalArg;
  let timingVariable1 = new Variable('$T1');
  let timingVariable2 = new Variable('$T2');
  let additionalArguments = [
    timingVariable1,
    timingVariable2
  ];
  if (literal instanceof Value) {
    literal = new Functor(literal.evaluate(), []);
  }
  if (!(literal instanceof Functor)) {
    throw new Error('Unexpected value "' + literal + '" provided for an event literal.');
  }
  literal = new Functor(literal.getName(), literal.getArguments().concat(additionalArguments));
  return literal;
};

module.exports = SyntacticSugarProcessor;
