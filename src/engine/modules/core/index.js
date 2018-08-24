/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const List = lpsRequire('engine/List');
const Timable = lpsRequire('engine/Timable');
const Functor = lpsRequire('engine/Functor');
const resolveValue = lpsRequire('engine/modules/core/resolveValue');

const mathFunctors = lpsRequire('engine/modules/core/math');
const ioFunctors = lpsRequire('engine/modules/core/io');
const listFunctors = lpsRequire('engine/modules/core/list');
const comparatorsFunctors = lpsRequire('engine/modules/core/comparators');
const typesFunctors = lpsRequire('engine/modules/core/types');

// eslint-disable-next-line no-unused-vars
module.exports = (engine, program) => {
  const coreFunctors = {
    '!/1': function (literalArg) {
      let literal = literalArg;
      if (!(literal instanceof Functor) && !(literal instanceof Timable)) {
        throw new Error('Literal not functor or timable in !/1 argument');
      }
      let result = [];

      let queryResult = engine.query(literal);
      if (queryResult.length === 0) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '=/2': function (lhs, rhs) {
      if (!(lhs instanceof Variable)) {
        throw new Error('LHS of variable assignment must be a variable. ' + lhs + ' given instead.');
      }

      let result = [];
      let resolvedRHS = resolveValue.call(this, rhs);
      if (resolvedRHS instanceof Array) {
        resolvedRHS.forEach((instance) => {
          result = result.concat(coreFunctors['=/2'](lhs, instance));
        });
        return result;
      }
      let theta = {};
      theta[lhs.evaluate()] = resolvedRHS;
      result.push({
        theta: theta
      });
      return result;
    },

    'findall/3': function (template, goal, output) {
      if (!(output instanceof Variable)) {
        throw new Error('The last argument of findall/3 must be a variable.');
      }
      let goalResult = engine.query(goal);
      let outputResult = [];
      goalResult.forEach((tuple) => {
        outputResult.push(template.substitute(tuple.theta));
      });
      let theta = {};
      theta[output.evaluate()] = new List(outputResult);
      return [{ theta: theta }];
    },

    'functor/3': function (term, name, arity) {
      if (!(term instanceof Functor)) {
        throw new Error('Argument 1 of functor/3 must be a functor.');
      }

      let theta = {};
      if (name instanceof Variable) {
        theta[name.evaluate()] = new Functor(term.getName(), []);
      } else if (name.evaluate() !== term.getName()) {
        return [];
      }

      if (arity instanceof Variable) {
        theta[arity.evaluate()] = new Value(term.getArgumentCount());
      } else if (arity.evaluate() !== term.getArgumentCount()) {
        return [];
      }

      return [{ theta: theta }];
    },

    'lpsHalt/0': function () {
      engine.halt();
      return [{ theta: {} }];
    }
  };

  let functorProvider = engine.getFunctorProvider();
  functorProvider.load(coreFunctors);
  functorProvider.load(comparatorsFunctors);
  functorProvider.load(typesFunctors);
  functorProvider.load(listFunctors);
  functorProvider.load(ioFunctors);
  functorProvider.load(mathFunctors);
};
