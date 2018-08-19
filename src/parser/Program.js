/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const FunctorProvider = lpsRequire('engine/FunctorProvider');
const Clause = lpsRequire('engine/Clause');
const Functor = lpsRequire('engine/Functor');
const NodeTypes = lpsRequire('parser/NodeTypes');
const List = lpsRequire('engine/List');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Timable = lpsRequire('engine/Timable');
const Resolutor = lpsRequire('engine/Resolutor');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Parser = lpsRequire('parser/Parser');
const stringLiterals = lpsRequire('utility/strings');
const unexpectedTokenErrorMessage = lpsRequire('parser/unexpectedTokenErrorMessage');

const fs = require('fs');

let processArguments;

let processBinaryOperator = function processBinaryOperator(node, singleUnderscoreVariableSet) {
  let operator = node.getToken().value;
  return new Functor(operator, processArguments(node.getChildren(), singleUnderscoreVariableSet));
};

let processUnaryOperator = function processUnaryOperator(node, singleUnderscoreVariableSet) {
  let operator = node.getToken().value;
  if (operator === 'not') {
    operator = '!';
  }

  let opArgs = processArguments(node.getChildren(), singleUnderscoreVariableSet);
  if (operator === '!' && opArgs.length === 1) { // negation optimisation
    if (opArgs[0] instanceof Functor && opArgs[0].getId() === '!/1') {
      let operands = opArgs[0].getArguments();
      return operands[0];
    }
  }

  return new Functor(operator, opArgs);
};

let processList = function processList(nodes, singleUnderscoreVariableSet) {
  if (nodes.length === 0) {
    return new List([]);
  }
  let head = processArguments(nodes[0].getChildren(), singleUnderscoreVariableSet);
  if (nodes.length > 1) {
    let tail = processArguments([nodes[1]], singleUnderscoreVariableSet)[0];
    return new List(head, tail);
  }
  return new List(head);
};

let processVariable = function processVariable(node, singleUnderscoreVariableSetArg) {
  let singleUnderscoreVariableSet = singleUnderscoreVariableSetArg;
  let name = node.getToken().value;
  if (name === '_') {
    name = '$_' + String(singleUnderscoreVariableSet.next);
    singleUnderscoreVariableSet.next += 1;
  }
  return new Variable(name);
};

let processFunctor = function processFunctor(node, singleUnderscoreVariableSet) {
  let name = node.getToken().value;
  return new Functor(name, processArguments(node.getChildren(), singleUnderscoreVariableSet));
};

processArguments = function (nodes, singleUnderscoreVariableSetArg) {
  let singleUnderscoreVariableSet = singleUnderscoreVariableSetArg;
  let result = [];

  nodes.forEach((node) => {
    switch (node.getType()) {
      case NodeTypes.Constant:
        result.push(new Value(node.getToken().value));
        break;
      case NodeTypes.BinaryOperator:
        result.push(processBinaryOperator(node, singleUnderscoreVariableSet));
        break;
      case NodeTypes.UnaryOperator:
        result.push(processUnaryOperator(node, singleUnderscoreVariableSet));
        break;
      case NodeTypes.List:
        result.push(processList(node.getChildren(), singleUnderscoreVariableSet));
        break;
      case NodeTypes.Number:
        result.push(new Value(node.getToken().value));
        break;
      case NodeTypes.Functor:
        result.push(processFunctor(node, singleUnderscoreVariableSet));
        break;
      case NodeTypes.Variable: {
        result.push(processVariable(node, singleUnderscoreVariableSet));
        break;
      }
      default:
        let error = new Error();
        error.token = node.getToken();
        throw error;
    }
  });

  return result;
};

let processTimable = function processTimable(node, singleUnderscoreVariableSet) {
  let parameters = processArguments(node.getChildren(), singleUnderscoreVariableSet);
  let goal = parameters[0];
  let startTime = parameters[1];
  let endTime = parameters[1];
  if (parameters.length > 2) {
    endTime = parameters[2];
  }
  return new Timable(goal, startTime, endTime);
};

let processLiteral = function processLiteral(node, singleUnderscoreVariableSet) {
  switch (node.getType()) {
    case NodeTypes.Timable:
      return processTimable(node, singleUnderscoreVariableSet);
    case NodeTypes.Functor:
      return processFunctor(node, singleUnderscoreVariableSet);
    case NodeTypes.BinaryOperator:
      return processBinaryOperator(node, singleUnderscoreVariableSet);
    case NodeTypes.UnaryOperator:
      return processUnaryOperator(node, singleUnderscoreVariableSet);
    default:
      let error = new Error();
      error.token = node.getToken();
      throw error;
  }
};

let processLiteralSet = function processLiteralSet(literals, singleUnderscoreVariableSet) {
  let result = [];
  literals.forEach((nodeArg) => {
    let node = nodeArg;
    let isNegated = false;
    while (node.getType() === NodeTypes.Negation) {
      node = node.getChildren()[0];
      isNegated = !isNegated;
    }
    let term = processLiteral(node, singleUnderscoreVariableSet);
    if (isNegated) {
      term = new Functor('!', [term]);
    }
    result.push(term);
  });
  return result;
};

let processFact = function processFact(literals) {
  let singleUnderscoreVariableSet = {
    next: 0
  };
  let literalSet = processLiteralSet(literals, singleUnderscoreVariableSet);
  return literalSet;
};

let processConstraint = function processConstraint(bodyLiterals) {
  let singleUnderscoreVariableSet = {
    next: 0,
    set: {}
  };
  let bodySet = processLiteralSet(bodyLiterals, singleUnderscoreVariableSet);
  return new Clause([], bodySet);
};

let processRuleOrClause = function processRuleOrClause(headLiterals, bodyLiterals) {
  let singleUnderscoreVariableSet = {
    next: 0,
    set: {}
  };
  let headSet = processLiteralSet(headLiterals, singleUnderscoreVariableSet);
  let bodySet = processLiteralSet(bodyLiterals, singleUnderscoreVariableSet);
  return new Clause(headSet, bodySet);
};

let processLine = function processLine(clauseNode, properties) {
  let children = clauseNode.getChildren();
  if (children.length === 1) {
    // single fact
    processFact(children[0].getChildren()).forEach((fact) => {
      properties.facts.add(fact);
    });
    return;
  }

  if (children.length === 2 && children[0].getToken().value === '<-') {
    // a constraint format
    properties.constraints
      .push(processConstraint(children[1].getChildren()));
    return;
  }

  // sanity check (2 literal sets and one operator)
  if (children.length !== 3 || children[1].getType() !== NodeTypes.Symbol) {
    throw new Error('invalid number of children in clause node');
  }

  let operator = children[1].getToken().value;
  if (operator === '<-') {
    // a program clause in the form: consequent <- antecedent
    properties.clauses
      .push(processRuleOrClause(children[0].getChildren(), children[2].getChildren()));
    return;
  }

  // a LPS rule in the form: conditions -> consequent
  properties.rules
    .push(processRuleOrClause(children[2].getChildren(), children[0].getChildren()));
};

let processProgramTree = function processProgramTree(rootNode, properties) {
  let nodes = rootNode.getChildren();
  nodes.forEach((node) => {
    processLine(node, properties);
  });
};

function Program(nodeTree, functorProviderArg) {
  let _rules = [];
  let _clauses = [];
  let _constraints = [];
  let _facts = new LiteralTreeMap();
  let _currentState = new LiteralTreeMap();
  let _executedActions = new LiteralTreeMap();

  let _clauseMap = new LiteralTreeMap();

  let _fluents = {};
  let _actions = {};
  let _events = {};

  let _functorProvider;
  if (functorProviderArg === undefined) {
    _functorProvider = new FunctorProvider(this);
  } else {
    _functorProvider = functorProviderArg.clone(this);
  }

  this.clone = function clone() {
    let program = new Program(null, _functorProvider);
    let newFacts = new LiteralTreeMap();
    _facts.forEach((fact) => {
      newFacts.add(fact);
    });
    program.setFacts(newFacts);
    program.setClauses(_clauses.concat([]));
    program.setConstraints(_constraints.concat([]));
    program.updateRules(_rules.concat([]));

    Object.keys(_actions).forEach((actionId) => {
      program.defineAction(actionId);
    });

    Object.keys(_events).forEach((eventId) => {
      program.defineEvent(eventId);
    });

    Object.keys(_fluents).forEach((fluentId) => {
      program.defineFluent(fluentId);
    });

    let newState = new LiteralTreeMap();
    _currentState.forEach((l) => {
      newState.add(l);
    });
    program.updateState(newState);

    let newExecutedActions = new LiteralTreeMap();
    _executedActions.forEach((l) => {
      newExecutedActions.add(l);
    });
    program.setExecutedActions(newExecutedActions);
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
  };

  this.getConstraints = function getConstraints() {
    return _constraints;
  };

  this.setConstraints = function setConstraints(constraints) {
    _constraints = constraints;
  };

  this.updateRules = function updateRules(rules) {
    _rules = rules;
  };

  this.getRules = function getRules() {
    return _rules.map(x => x);
  };

  this.getState = function getState() {
    return _currentState;
  };

  this.updateState = function updateState(newState) {
    _currentState = newState;
  };

  this.getFunctorProvider = function getFunctorProvider() {
    return _functorProvider;
  };

  this.getExecutedActions = function getExecutedActions() {
    return _executedActions;
  };

  this.setExecutedActions = function setExecutedActions(newSet) {
    _executedActions = newSet;
  };

  this.query = function query(goal, otherFacts) {
    let evaluationResult = Resolutor.explain(goal, this, otherFacts);
    return evaluationResult;
  };

  this.getDefinitions = function getDefinitions(literal) {
    let result = [];
    let literalMap = new LiteralTreeMap();
    literalMap.add(literal);

    _clauses.forEach((clause) => {
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

  let buildClauseMap = function buildClauseMap(map, clauses) {
    // TODO
    // clauses.forEach((clause) => {
    //   let headLiteral = clause.getHeadLiterals()[0];
    //   let list = [];
    //   if (!map.contains(headLiteral)) {
    //     map.add(headLiteral, list);
    //   } else {
    //     list = map.get(headLiteral);
    //   }
    //   list.push(clause);
    // });
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
    _constraints = _constraints.concat(program.getConstraints());
    program
      .getFacts()
      .forEach((fact) => {
        _facts.add(fact);
      });
    buildClauseMap(_clauseMap, programClauses);
  };

  if (nodeTree !== null && nodeTree !== undefined) {
    // process AST to build the program
    processProgramTree(nodeTree, {
      rules: _rules,
      clauses: _clauses,
      constraints: _constraints,
      facts: _facts
    });
    buildClauseMap(_clauseMap, _clauses);
  }
}

Program.literal = function literal(str) {
  let node = Parser.parseLiteral(str);
  let singleUnderscoreVariableSet = {
    next: 0,
    set: {}
  };
  return processFunctor(node, singleUnderscoreVariableSet);
};

Program.literalSet = function literalSet(str) {
  let node = Parser.parseConjunction(str);
  let singleUnderscoreVariableSet = {
    next: 0,
    set: {}
  };
  return processLiteralSet(node.getChildren(), singleUnderscoreVariableSet);
};

Program.fromString = function fromString(code) {
  return new Promise((resolve, reject) => {
    let token;
    try {
      let parser = new Parser(code);
      token = parser.build();
        resolve(new Program(token));
    } catch (err) {
      let errorToken = err.token;
      console.log(errorToken);
      let errorMessage = unexpectedTokenErrorMessage(source, errorToken, err.likelyMissing);
      reject(new Error(errorMessage));
    }
  });
};

Program.fromFile = function fromFile(pathname) {
  return new Promise((resolve, reject) => {
    if (process.browser) {
      reject(stringLiterals.error('browserContext.loadProgramFromFile'));
      return;
    }
    fs.readFile(pathname, 'utf8', (err, source) => {
      if (err) {
        reject(err);
        return;
      }
      let token;
      try {
        let parser = new Parser(source, pathname);
        token = parser.build();
        resolve(new Program(token));
      } catch (err) {
        let errorToken = err.token;
        let errorMessage = unexpectedTokenErrorMessage(source, errorToken, err.likelyMissing);
        errorMessage = stringLiterals('parser.loadFileErrorHeader', [pathname, errorMessage]);
        reject(new Error(errorMessage));
      }
    });
  });
};

module.exports = Program;
