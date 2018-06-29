const FunctorProvider = require('../engine/FunctorProvider');
const Clause = require('../engine/Clause');
const Functor = require('../engine/Functor');
const NodeTypes = require('./NodeTypes');
const AstNode = require('./AstNode');
const List = require('../engine/List');
const Value = require('../engine/Value');
const Variable = require('../engine/Variable');
const Resolutor = require('../engine/Resolutor');
const GoalTree = require('../engine/GoalTree');
const LiteralTreeMap = require('../engine/LiteralTreeMap');
const Parser = require('./Parser');

const fs = require('fs');

let processBinaryOperator = function processBinaryOperator(node, singleUnderscoreVariableSet) {
  let operator = node.getToken().value;
  return new Functor(operator, processArguments(node.getChildren(), singleUnderscoreVariableSet));
};

let processUnaryOperator = function processUnaryOperator(node, singleUnderscoreVariableSet) {
  let operator = node.getToken().value;
  if (operator === 'not') {
    operator = '!';
  }
  return new Functor(operator, processArguments(node.getChildren(), singleUnderscoreVariableSet));
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

let processArguments = function processArguments(nodes, singleUnderscoreVariableSet) {
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
      case NodeTypes.Variable:
        let name = node.getToken().value;
        if (name === '_') {
          name = '$_' + String(singleUnderscoreVariableSet.next);
          singleUnderscoreVariableSet.next += 1;
        }
        result.push(new Variable(name));
        break;
      default:
        throw new Error('Unexpected node type in arguments set: '
          + String(node.getType()) + ' ' + JSON.stringify(node.getToken()));
    }
  });

  return result;
};

let processFunctor = function processFunctor(node, singleUnderscoreVariableSet) {
  let name = node.getToken().value;
  return new Functor(name, processArguments(node.getChildren(), singleUnderscoreVariableSet));
};

let processLiteralSet = function processLiteralSet(literals, singleUnderscoreVariableSet) {
  let result = [];
  literals.forEach((node) => {
    switch (node.getType()) {
      case NodeTypes.Functor:
        result.push(processFunctor(node, singleUnderscoreVariableSet));
        break;
      case NodeTypes.BinaryOperator:
        result.push(processBinaryOperator(node, singleUnderscoreVariableSet));
        break;
      case NodeTypes.UnaryOperator:
        result.push(processUnaryOperator(node, singleUnderscoreVariableSet));
        break;
      default:
        throw new Error('Unexpected node type in literal set: '
          + String(node.getType()) + ' ' + JSON.stringify(node.getToken()));
    }
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
    properties.program.push(processConstraint(children[1].getChildren()));
    return;
  }

  // sanity check (2 literal sets and one operator)
  if (children.length !== 3 || children[1].getType() !== NodeTypes.Symbol) {
    throw new Error('invalid number of children in clause node');
  }

  let operator = children[1].getToken().value;
  if (operator === '<-') {
    // a program clause in the form: consequent <- antecedent
    properties.program.push(processRuleOrClause(children[0].getChildren(), children[2].getChildren()));
    return;
  }

  // a LPS rule in the form: conditions -> consequent
  properties.rules.push(processRuleOrClause(children[2].getChildren(), children[0].getChildren()));
};

let processProgram = function processProgram(rootNode, properties) {
  let clauseNodes = rootNode.getChildren();
  clauseNodes.forEach((clauseNode) => {
    processLine(clauseNode, properties);
  });
};

function Program(nodeTree) {
  let _rules = [];
  let _clauses = [];
  let _facts = new LiteralTreeMap();
  let _currentState = new LiteralTreeMap();
  let _executedActions = new LiteralTreeMap();

  let _fluents = {};
  let _actions = {};
  let _events = {};

  let _functorProvider = new FunctorProvider(this);

  if (nodeTree instanceof AstNode) {
    processProgram(nodeTree, {
      rules: _rules,
      program: _clauses,
      facts: _facts
    });
  }

  this.clone = function clone() {
    let program = new Program();
    let newFacts = new LiteralTreeMap();
    _facts.forEach((fact) => {
      newFacts.add(fact);
    });
    program.setFacts(newFacts);
    program.setClauses(_clauses.concat([]));
    program.updateRules(_rules.concat([]));

    let newState = new LiteralTreeMap();
    _currentState.forEach((l) => {
      newState.add(l);
    });
    program.updateState(newState);

    let newExecutedActions = new LiteralTreeMap();
    _executedActions.forEach((l) => {
      newExecutedActions.add(l);
    });
    program.setExecutedActions(_executedActions);
    return program;
  };

  let isIdDefined = function isIdDefined(id) {
    return _fluents[id] !== undefined
      || _events[id] !== undefined
      || _actions[id] !== undefined;
  };

  let processLiteralId = function processLiteralId(literal) {
    let result = literal;
    if (literal instanceof Functor) {
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

  this.isTimable = function isTimable(timable) {
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
    return _clauses.map(x => x);
  };

  this.setClauses = function setClauses(clauses) {
    _clauses = clauses;
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

  this.query = function query(query, otherFacts) {
    let evaluationResult = Resolutor.explain(query, this, otherFacts);
    return evaluationResult;
  };

  this.augment = function augment(program) {
    if (!(program instanceof Program)) {
      throw new Error('Expecting program in the argument for augment function');
    }
    if (program === this) {
      throw new Error('A program cannot augment itself.');
    }

    _rules = _rules.concat(program.getRules());
    _clauses = _clauses.concat(program.getClauses());
    program
      .getFacts()
      .forEach((fact) => {
        _facts.add(fact);
      });
  };
}

Program.literal = function literal(str) {
  let node = Parser.parseLiteral(str);
  let singleUnderscoreVariableSet = {
    next: 0,
    set: {}
  };
  return processFunctor(node, singleUnderscoreVariableSet);
};

Program.fromString = function fromString(code) {
  return new Promise((resolve, reject) => {
    try {
      let parser = new Parser(code);
      token = parser.build();
    } catch (err) {
      err.message = 'From string, ' + err.message;
      reject(err);
      return;
    }
    resolve(new Program(token));
  });
};

Program.fromFile = function fromFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      let token;
      try {
        let parser = new Parser(data);
        token = parser.build();
      } catch (err) {
        err.message = 'In file ' + file + ', ' + err.message;
        reject(err);
        return;
      }
      resolve(new Program(token));
    });
  });
};

module.exports = Program;
