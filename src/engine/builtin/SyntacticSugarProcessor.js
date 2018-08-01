const Functor = lpsRequire('engine/Functor');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');

function SyntacticSugarProcessor() {

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
