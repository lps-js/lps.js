const BuiltInFunctorProvider = require('../engine/BuiltInFunctorProvider');
const Clause = require('../engine/Clause');
const Functor = require('../engine/Functor');
const NodeTypes = require('./NodeTypes');
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
  let _program = [];
  let _facts = new LiteralTreeMap();

  processProgram(nodeTree, {
    rules: _rules,
    program: _program,
    facts: _facts
  });

  this.getFacts = function getFacts() {
    return _facts;
  };

  this.getProgram = function getProgram() {
    return _program.map(x => x);
  };

  this.updateRules = function updateRules(rules) {
    _rules = rules;
  };

  this.getRules = function getRules() {
    return _rules.map(x => x);
  };

  this.query = function query(query, otherFacts) {
    if (otherFacts === undefined) {
      otherFacts = new LiteralTreeMap();
    }
    let facts = [_facts];
    if (otherFacts instanceof LiteralTreeMap) {
      facts.push(otherFacts);
    }
    let builtInFunctorProvider = new BuiltInFunctorProvider({}, (literal) => {
      return Resolutor.findUnifications(literal, facts);
    });

    let evaluationResult = Resolutor.explain(query, builtInFunctorProvider, _program, facts);
    return evaluationResult;
  };

  this.augment = function augment(program) {
    if (!(program instanceof Program)) {
      throw new Error('Expecting program in the argument for augment function');
    }

    _rules = _rules.concat(program.getRules());
    _program = _program.concat(program.getProgram());
    program.getFacts().forEach((fact) => {
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

Program.fromFile = function fromFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        reject(err);
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
