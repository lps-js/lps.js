/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Functor = lpsRequire('engine/Functor');
const Variable = lpsRequire('engine/Variable');
const Timable = lpsRequire('engine/Timable');
const Resolutor = lpsRequire('engine/Resolutor');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const stringLiterals = lpsRequire('utility/strings');

function _ProgramCloneType() {}

const sortClauses = (clauseSet, sortedSetArg) => {
  let sortedSet = sortedSetArg;
  clauseSet.forEach((clause) => {
    let headLiteral = clause.getHeadLiterals()[0];
    let list = sortedSet[headLiteral.getId()];
    if (list === undefined) {
      list = [];
      sortedSet[headLiteral.getId()] = list;
    }
    list.push(clause);
  });
};

function Program() {
  let _rules = [];
  let _clauses = [];
  let _sortedClauses = {};
  let _constraints = [];
  let _facts = new LiteralTreeMap();
  let _currentState = new LiteralTreeMap();
  let _executedActions = new LiteralTreeMap();
  let _workingDirectory = '';

  let _fluents = {};
  let _actions = {};
  let _events = {};

  this.clone = function clone() {
    if (this instanceof _ProgramCloneType) {
      return (program) => {
        _fluents = Object.assign({}, program.fluents);
        _actions = Object.assign({}, program.actions);
        _events = Object.assign({}, program.events);

        _facts = program.facts.clone();

        _rules = program.rules.concat();
        _clauses = program.clauses.concat();
        _sortedClauses = program.sortedClauses;
        _constraints = program.constraints.concat();

        _currentState = program.state.clone();
        _executedActions = program.executedActions.clone();

        _workingDirectory = program.workingDirectory;
      };
    }
    let program = new Program();
    let loader = program.clone.call(new _ProgramCloneType());
    loader({
      fluents: _fluents,
      actions: _actions,
      events: _events,
      facts: _facts,
      rules: _rules,
      clauses: _clauses,
      sortedClauses: _sortedClauses,
      constraints: _constraints,
      state: _currentState,
      executedActions: _executedActions,
      workingDirectory: _workingDirectory
    });
    return program;
  };

  let isIdDefined = function isIdDefined(id) {
    return _fluents[id] !== undefined
      || _events[id] !== undefined
      || _actions[id] !== undefined;
  };

  let processLiteralId = function processLiteralId(literalArg) {
    let result = literalArg;
    if (result instanceof Timable) {
      result = result.getGoal();
    }
    if (result instanceof Functor) {
      let literal = result;
      while (literal instanceof Functor && literal.getId() === '!/1') {
        literal = literal.getArguments()[0];
      }
      result = literal.getId();
    }
    return result;
  };

  this.defineFluent = function defineFluent(fluent) {
    let id = processLiteralId(fluent);
    if (isIdDefined(id)) {
      throw new Error('Predicate ' + id + ' previously defined.');
    }

    _fluents[id] = true;
  };

  this.defineAction = function defineAction(action) {
    let id = processLiteralId(action);
    if (isIdDefined(id)) {
      throw new Error('Predicate ' + id + ' previously defined.');
    }

    _actions[id] = true;
  };

  this.defineEvent = function defineEvent(event) {
    let id = processLiteralId(event);
    if (isIdDefined(id)) {
      throw new Error('Predicate ' + id + ' previously defined.');
    }

    _events[id] = true;
  };

  this.isFluent = function isFluent(literal) {
    let id = processLiteralId(literal);
    return _fluents[id] !== undefined;
  };

  this.isAction = function isAction(literal) {
    let id = processLiteralId(literal);
    return _actions[id] !== undefined;
  };

  this.isEvent = function isEvent(literal) {
    let id = processLiteralId(literal);
    return _events[id] !== undefined;
  };

  this.isTimableUntimed = function isTimableUntimed(timable) {
    let id = processLiteralId(timable);
    let timableArgs = timable.getArguments();
    let numArgs = timableArgs.length;
    if (_fluents[id] !== undefined) {
      return timableArgs[numArgs - 1] instanceof Variable;
    }
    if (_actions[id] !== undefined || _events[id] !== undefined) {
      return timableArgs[numArgs - 2] instanceof Variable
        && timableArgs[numArgs - 1] instanceof Variable;
    }
    return false;
  };

  this.isTimable = function isTimable(timableArg) {
    let timable = timableArg;
    // unfold negations for timable argument
    while (timable instanceof Functor && timable.getId() === '!/1') {
      timable = timable.getArguments()[0];
    }
    let id = processLiteralId(timable);
    return _fluents[id] !== undefined
      || _actions[id] !== undefined
      || _events[id] !== undefined;
  };

  this.setWorkingDirectory = function setWorkingDirectory(dir) {
    _workingDirectory = dir;
  };

  this.getWorkingDirectory = function getWorkingDirectory() {
    return _workingDirectory;
  };

  this.getFacts = function getFacts() {
    return _facts;
  };

  this.setFacts = function setFacts(newFacts) {
    _facts = newFacts;
  };

  this.getClauses = function getClauses() {
    return _clauses;
  };

  this.setClauses = function setClauses(clauses) {
    _clauses = clauses;
    _sortedClauses = {};
    sortClauses(_clauses, _sortedClauses);
  };

  this.getConstraints = function getConstraints() {
    return _constraints;
  };

  this.setConstraints = function setConstraints(constraints) {
    _constraints = constraints;
  };

  this.setRules = function setRules(rules) {
    _rules = rules;
  };

  this.getRules = function getRules() {
    return _rules;
  };

  this.getState = function getState() {
    return _currentState;
  };

  this.setState = function setState(newState) {
    _currentState = newState;
  };

  this.getExecutedActions = function getExecutedActions() {
    return _executedActions;
  };

  this.setExecutedActions = function setExecutedActions(newSet) {
    _executedActions = newSet;
  };

  this.query = function query(goal, engine, otherFacts) {
    return Resolutor.explain(goal, this, engine, otherFacts);
  };

  this.getDefinitions = function getDefinitions(literal) {
    let result = [];
    let literalMap = new LiteralTreeMap();
    literalMap.add(literal);
    let set = _sortedClauses[literal.getId()];
    if (set === undefined) {
      return [];
    }
    set.forEach((clause) => {
      // horn clause guarantees only one literal
      let headLiterals = clause.getHeadLiterals();
      let headLiteral = headLiterals[0];

      literalMap
        .unifies(headLiteral)
        .forEach((tuple) => {
          let unificationTheta = tuple.theta;
          let updatedHeadLiteral = headLiteral.substitute(unificationTheta);
          let bodyLiterals = clause.getBodyLiterals()
            .map((bl) => {
              return bl.substitute(unificationTheta);
            });
          result.push({
            headLiteral: updatedHeadLiteral,
            theta: unificationTheta,
            internalTheta: tuple.internalTheta,
            definition: bodyLiterals
          });
        });
    });
    return result;
  };

  this.augment = function augment(program) {
    if (!(program instanceof Program)) {
      throw stringLiterals.error(
        'generic.parameterInvalidType',
        'program',
        'augment',
        'Program',
        typeof program
      );
    }
    if (program === this) {
      throw stringLiterals.error('program.selfAugmentation');
    }

    let programClauses = program.getClauses();

    _rules = _rules.concat(program.getRules());
    _clauses = _clauses.concat(programClauses);
    sortClauses(programClauses, _sortedClauses);
    _constraints = _constraints.concat(program.getConstraints());
    program
      .getFacts()
      .forEach((fact) => {
        _facts.add(fact);
      });
  };
}

module.exports = Program;
