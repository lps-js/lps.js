/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const List = lpsRequire('engine/List');
const Timable = lpsRequire('engine/Timable');
const Functor = lpsRequire('engine/Functor');
const resolveValue = lpsRequire('engine/modules/core/resolveValue');
const assertIsValue = lpsRequire('engine/modules/core/assertIsValue');
const checkOrSetOutputArg = lpsRequire('engine/modules/core/checkOrSetOutputArg');

const mathFunctors = lpsRequire('engine/modules/core/math');
const ioFunctors = lpsRequire('engine/modules/core/io');
const listFunctors = lpsRequire('engine/modules/core/list');
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

      let thisProgram = this.getProgram();
      let queryResult = thisProgram.query(literal);
      if (queryResult.length === 0) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '>/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue.call(this, v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(coreFunctors['>/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue.call(this, v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(coreFunctors['>/2'](v1, instance));
        });
        return result;
      }

      if (v1 instanceof Variable || v2 instanceof Variable) {
        return [];
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let num1 = Number(v1.evaluate());
      let num2 = Number(v2.evaluate());

      if (num1 > num2) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '>=/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue.call(this, v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(coreFunctors['>=/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue.call(this, v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(coreFunctors['>=/2'](v1, instance));
        });
        return result;
      }

      if (v1 instanceof Variable || v2 instanceof Variable) {
        return [];
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let num1 = Number(v1.evaluate());
      let num2 = Number(v2.evaluate());

      if (num1 >= num2) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '</2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue.call(this, v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(coreFunctors['</2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue.call(this, v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(coreFunctors['</2'](v1, instance));
        });
        return result;
      }

      if (v1 instanceof Variable || v2 instanceof Variable) {
        return [];
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let num1 = Number(v1.evaluate());
      let num2 = Number(v2.evaluate());

      if (num1 < num2) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '<=/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue.call(this, v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(coreFunctors['<=/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue.call(this, v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(coreFunctors['<=/2'](v1, instance));
        });
        return result;
      }

      if (v1 instanceof Variable) {
        result.push({
          theta: {},
          replacement: new Functor('<=/2', [v1, v2])
        });
        return result;
      }

      if (v2 instanceof Variable) {
        result.push({
          theta: {},
          replacement: new Functor('<=/2', [v1, v2])
        });
        return result;
      }

      if (v1 instanceof Variable || v2 instanceof Variable) {
        return [];
      }

      assertIsValue(v1);
      assertIsValue(v2);

      let num1 = Number(v1.evaluate());
      let num2 = Number(v2.evaluate());

      if (num1 <= num2) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '==/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue.call(this, v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(coreFunctors['==/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue.call(this, v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(coreFunctors['==/2'](v1, instance));
        });
        return result;
      }

      if (v1 instanceof Variable || v2 instanceof Variable) {
        return [];
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let num1 = v1.evaluate();
      let num2 = v2.evaluate();

      if (num1 === num2) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '!=/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue.call(this, v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(coreFunctors['!=/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue.call(this, v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(coreFunctors['!=/2'](v1, instance));
        });
        return result;
      }

      if (v1 instanceof Variable || v2 instanceof Variable) {
        return [];
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let num1 = v1.evaluate();
      let num2 = v2.evaluate();

      // eslint-disable-next-line eqeqeq
      if (num1 != num2) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '@</2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue.call(this, v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(coreFunctors['@</2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue.call(this, v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(coreFunctors['@</2'](v1, instance));
        });
        return result;
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let compareResult = String(v1.evaluate()).localeCompare(String(v2.evaluate()));

      if (compareResult === -1) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '@=/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue.call(this, v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(coreFunctors['@=/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue.call(this, v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(coreFunctors['@=/2'](v1, instance));
        });
        return result;
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let compareResult = String(v1.evaluate()).localeCompare(String(v2.evaluate()));

      if (compareResult === 0) {
        result.push({
          theta: {}
        });
      }
      return result;
    },

    '@>/2': function (v1Arg, v2Arg) {
      let result = [];
      let v1 = resolveValue.call(this, v1Arg);
      if (v1 instanceof Array) {
        v1.forEach((instance) => {
          result = result.concat(coreFunctors['@>/2'](instance, v2Arg));
        });
        return result;
      }

      let v2 = resolveValue.call(this, v2Arg);
      if (v2 instanceof Array) {
        v2.forEach((instance) => {
          result = result.concat(coreFunctors['@>/2'](v1, instance));
        });
        return result;
      }

      assertIsValue(v1);
      assertIsValue(v2);
      let compareResult = String(v1.evaluate()).localeCompare(String(v2.evaluate()));

      if (compareResult === 1) {
        result.push({
          theta: {}
        });
      } // else result remains an empty array
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
      let goalResult = this.getProgram().query(goal);
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

  let functorProvider = program.getFunctorProvider();
  functorProvider.load(coreFunctors);
  functorProvider.load(typesFunctors);
  functorProvider.load(listFunctors);
  functorProvider.load(ioFunctors);
  functorProvider.load(mathFunctors);
};
