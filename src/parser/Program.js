const FunctorProvider = lpsRequire('engine/FunctorProvider');
const Clause = lpsRequire('engine/Clause');
const Functor = lpsRequire('engine/Functor');
const NodeTypes = lpsRequire('parser/NodeTypes');
const AstNode = lpsRequire('parser/AstNode');
const List = lpsRequire('engine/List');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Resolutor = lpsRequire('engine/Resolutor');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Parser = lpsRequire('parser/Parser');
const buildIntensionalSet = lpsRequire('utility/buildIntensionalSet');

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

let processArguments = function processArguments(nodes, singleUnderscoreVariableSetArg) {
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
        let name = node.getToken().value;
        if (name === '_') {
          name = '$_' + String(singleUnderscoreVariableSet.next);
          singleUnderscoreVariableSet.next += 1;
        }
        result.push(new Variable(name));
        break;
      }
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
    properties.program
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
    properties.program
      .push(processRuleOrClause(children[0].getChildren(), children[2].getChildren()));
    return;
  }

  // a LPS rule in the form: conditions -> consequent
  properties.rules
    .push(processRuleOrClause(children[2].getChildren(), children[0].getChildren()));
};

let processProgram = function processProgram(rootNode, properties) {
  let clauseNodes = rootNode.getChildren();
  clauseNodes.forEach((clauseNode) => {
    processLine(clauseNode, properties);
  });
};

function Program(nodeTree, functorProviderArg) {
  let _rules = [];
  let _clauses = [];
  let _facts = new LiteralTreeMap();
  let _currentState = new LiteralTreeMap();
  let _executedActions = new LiteralTreeMap();

  let _fluents = {};
  let _actions = {};
  let _events = {};
  let _intensionals = {};

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
    program.setExecutedActions(_executedActions);
    return program;
  };

  let isIdDefined = function isIdDefined(id) {
    return _fluents[id] !== undefined
      || _events[id] !== undefined
      || _actions[id] !== undefined;
  };

  let processLiteralId = function processLiteralId(literalArg) {
    let result = literalArg;
    if (literalArg instanceof Functor) {
      let literal = literalArg;
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
    _intensionals = buildIntensionalSet(this);
  };

  this.defineAction = function defineAction(action) {
    let id = processLiteralId(action);
    if (isIdDefined(id)) {
      throw new Error('Predicate ' + id + ' previously defined.');
    }

    _actions[id] = true;
    _intensionals = buildIntensionalSet(this);
  };

  this.defineEvent = function defineEvent(event) {
    let id = processLiteralId(event);
    if (isIdDefined(id)) {
      throw new Error('Predicate ' + id + ' previously defined.');
    }

    _events[id] = true;
    _intensionals = buildIntensionalSet(this);
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
      || _events[id] !== undefined
      || _intensionals[id] !== undefined;
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
    _intensionals = buildIntensionalSet(this);
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
    _intensionals = buildIntensionalSet(this);
  };

  if (nodeTree instanceof AstNode) {
    processProgram(nodeTree, {
      rules: _rules,
      program: _clauses,
      facts: _facts
    });
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
        let parser = new Parser(data, file);
        token = parser.build();
      } catch (e) {
        e.message = 'In file ' + file + ', ' + e.message;
        reject(e);
        return;
      }
      resolve(new Program(token));
    });
  });
};

module.exports = Program;
