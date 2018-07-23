const Functor = require('./Functor');
const List = require('./List');
const Value = require('./Value');
const Variable = require('./Variable');
const fs = require('fs');
const path = require('path');

const functorIdentifierRegex = /^[^0-9_A-Z]{1}[a-zA-Z_0-9]*\/[1-9][0-9]*$/;

function FunctorProvider(program) {
  let _functors = {
    '!/1': [
      function (literal) {
        if (!(literal instanceof Functor)) {
          throw new Error('Literal not functor');
        }
        let queryResult = program.query(literal);
        let result = [];
        if (queryResult.length === 0) {
          result.push({
            theta: {}
          });
        }
        return result;
      }
    ]
  };

  let loadByPassed = function loadByPassed(filepath) {
    if (!fs.existsSync(filepath)) {
      throw new Error('Loading non-existent file ' + filepath + ' for predicate definitions in LPS');
    }
    let definitions = require(filepath);
    Object.keys(definitions).forEach((key) => {
      let func = definitions[key];
      if (_functors[key] === undefined) {
        _functors[key] = [];
      }
      _functors[key].push(func);
    });
  };

  this.load = function load(filepath) {
    if (!fs.existsSync(filepath)) {
      throw new Error('Loading non-existent file ' + filepath + ' for predicate definitions in LPS');
    }
    let definitions = require(filepath);
    Object.keys(definitions).forEach((key) => {
      let func = definitions[key];
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

  loadByPassed(path.join(__dirname, 'modules/core.js'));
}


module.exports = FunctorProvider;
