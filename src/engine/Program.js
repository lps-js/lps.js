const Clause = require('./Clause');
const Functor = require('./Functor');
const NodeTypes = require('../parser/NodeTypes');
const Value = require('./Value');
const Variable = require('./Variable');
const Resolutor = require('./Resolutor');

let processBinaryOperator = function processBinaryOperator(node) {
  let operator = node.getToken().value;
  return new Functor(operator, processArguments(node.getChildren()));
};

let processUnaryOperator = function processUnaryOperator(node) {
  let operator = node.getToken().value;
  if (operator === 'not') {
    operator = '!';
  }
  return new Functor(operator, processArguments(node.getChildren()));
};

let processArguments = function processArguments(nodes) {
  let result = [];

  nodes.forEach((node) => {
    switch (node.getType()) {
      case NodeTypes.Constant:
        result.push(new Value(node.getToken().value));
        break;
      case NodeTypes.BinaryOperator:
        result.push(processBinaryOperator(node));
        break;
      case NodeTypes.UnaryOperator:
        result.push(processUnaryOperator(node));
        break;
      case NodeTypes.List:
        result.push(processArguments(node.getChildren()));
        break;
      case NodeTypes.Number:
        result.push(new Value(node.getToken().value));
        break;
      case NodeTypes.Functor:
        result.push(processFunctor(node));
        break;
      case NodeTypes.Variable:
        result.push(new Variable(node.getToken().value));
        break;
      default:
        throw new Error('Unexpected node type in arguments set: '
          + String(node.getType()) + ' ' + JSON.stringify(node.getToken()));
    }
  });

  return result;
};

let processFunctor = function processFunctor(node) {
  let name = node.getToken().value;
  return new Functor(name, processArguments(node.getChildren()));
};

let processLiteralSet = function processLiteralSet(literals) {
  let result = [];
  literals.forEach((node) => {
    switch (node.getType()) {
      case NodeTypes.Functor:
        result.push(processFunctor(node));
        break;
      case NodeTypes.BinaryOperator:
        result.push(processBinaryOperator(node));
        break;
      case NodeTypes.UnaryOperator:
        result.push(processUnaryOperator(node));
        break;
      default:
        throw new Error('Unexpected node type in literal set: '
          + String(node.getType()) + ' ' + JSON.stringify(node.getToken()));
    }
  });
  return result;
};

let processFactClause = function processFactClause(literals) {
  let literalSet = processLiteralSet(literals);
  return literalSet;
};

let processConstraintClause = function processConstraintClause(bodyLiterals) {
  let bodySet = processLiteralSet(bodyLiterals);
  return new Clause([], bodySet);
};

let processClause = function processClause(headLiterals, bodyLiterals) {
  let headSet = processLiteralSet(headLiterals);
  let bodySet = processLiteralSet(bodyLiterals);
  return new Clause(headSet, bodySet);
};

let processClauses = function processClauses(rootNode, properties) {
  let clauseNodes = rootNode.getChildren();
  clauseNodes.forEach((clauseNode) => {
    let children = clauseNode.getChildren();
    if (children.length === 1) {
      // single fact
      processFactClause(children[0].getChildren()).forEach((fact) => {
        properties.facts.push(fact);
      });
      return;
    }

    if (children.length === 2 && children[0].getToken().value === '<-') {
      // a constraint format
      properties.program.push(processConstraintClause(children[1].getChildren()));
      return;
    }

    // sanity check (2 literal sets and one operator)
    if (children.length !== 3 || children[1].getType() !== NodeTypes.Symbol) {
      throw new Error('invalid number of children in clause node');
    }

    let operator = children[1].getToken().value;
    if (operator === '<-') {
      // a program clause in the form: consequent <- antecedent
      properties.program.push(processClause(children[0].getChildren(), children[2].getChildren()));
      return;
    }

    // a LPS rule in the form: conditions -> consequent
    properties.rules.push(processClause(children[2].getChildren(), children[0].getChildren()));
  });
};

let isInSet = function isInSet(set, literal) {
  let literalStr = literal.toString();
  for (let i = 0; i < set.length; i += 1) {
    if (set[i].toString() === literalStr) {
      return true;
    }
  }
  return false;
};

let getProgramInterpretation = function getProgramInterpretation(facts, program) {
  let allFacts = [].concat(facts);
  let newFacts = [].concat(facts);
  let newProgram = [];
  let currentProgram = program;

  let checkAndAdd = function checkAndAdd(literal) {
    if (isInSet(newFacts, literal)) {
      return;
    }
    newFacts.push(literal);
  };

  let processClauseResolution = function processClauseResolution(clause) {
    if (clause.isFact()) {
      clause.getHeadLiterals().forEach(checkAndAdd);
      return;
    }

    allFacts.forEach((fact) => {
      let resolution = Resolutor.resolve(clause, fact);
      if (resolution === null) {
        // nothing got resolved
        return;
      }
      if (resolution.clause.isFact()) {
        resolution.clause.getHeadLiterals().forEach(checkAndAdd);
        return;
      }
      newProgram.push(resolution);
    });
    newProgram.push(clause);
  };

  do {
    newProgram = [];
    allFacts = [].concat(newFacts);
    currentProgram.forEach(processClauseResolution);
    currentProgram = newProgram;
  } while (newFacts.length > allFacts.length);
  return newFacts;
};

function Program(tree) {
  let _rules = [];
  let _program = [];
  let _facts = [];

  processClauses(tree, {
    rules: _rules,
    program: _program,
    facts: _facts,
  });

  _facts = getProgramInterpretation(_facts, _program);

  this.getFacts = function getFacts() {
    return _facts;
  };

  this.getProgram = function getProgram() {
    return _program;
  };

  this.getRules = function getRules() {
    return _rules;
  };
}

module.exports = Program;
