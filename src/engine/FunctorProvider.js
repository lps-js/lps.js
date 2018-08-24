/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Functor = lpsRequire('engine/Functor');

const functorIdentifierRegex = /^[^\s_A-Z][^\s]*\/[0-9]*$/;

function FunctorProvider(engine) {
  let _functors = {};

  this.load = function load(definitions) {
    Object.keys(definitions).forEach((key) => {
      let func = definitions[key];
      if (func instanceof Array) {
        func.forEach((f) => {
          this.define(key, f);
        });
        return;
      }
      this.define(key, func);
    });
  };

  this.define = function define(name, func) {
    if (name === '' || (typeof name !== 'string')) {
      throw new Error('Invalid name "' + name + '" given for functor definition');
    }

    if (!(func instanceof Function)) {
      throw new Error('Invalid function provided');
    }

    let functorId = name;
    if (functorId.indexOf('/') === -1) {
      // auto detect arity from given handler function.
      let arity = func.length;
      functorId += '/' + arity;
    }

    if (!functorIdentifierRegex.test(functorId)) {
      throw new Error('Invalid name "' + functorId + '" given for functor definition');
    }

    // _functors contain array of definitions for each functorId
    if (_functors[functorId] === undefined) {
      _functors[functorId] = [];
    }
    _functors[functorId].push(func);
  };

  this.has = function has(literal) {
    let functorId = literal;
    if (literal instanceof Functor) {
      functorId = literal.getId();
    }

    // _functors contain array of definitions for each functorId
    return _functors[functorId] !== undefined
      && _functors[functorId].length > 0;
  };

  this.execute = function execute(literal) {
    let functorId = literal.getId();
    let functorArgs = literal.getArguments();

    let hasExecution = false;
    // combine results
    let result = [];
    if (_functors[functorId] !== undefined) {
      hasExecution = true;
      // _functors contain array of definitions for each functorId
      _functors[functorId].forEach((handler) => {
        // combine results together
        result = result.concat(handler.apply(this, functorArgs));
      });
    }
    if (!hasExecution) {
      // no definition for functor found.
      throw new Error('Call to undefined functor "' + functorId + '"');
    }
    return result;
  };

  this.getEngine = function getEngine() {
    return engine;
  };
}


module.exports = FunctorProvider;
