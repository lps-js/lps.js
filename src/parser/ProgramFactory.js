/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Clause = lpsRequire('engine/Clause');
const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Timable = lpsRequire('engine/Timable');
const Program = lpsRequire('engine/Program');
const Parser = lpsRequire('parser/Parser');
const NodeTypes = lpsRequire('parser/NodeTypes');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const stringLiterals = lpsRequire('utility/strings');
const unexpectedTokenErrorMessage = lpsRequire('parser/unexpectedTokenErrorMessage');

const fs = require('fs');

let processArguments;
let processLiteral;

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
      default: {
        let error = new Error();
        error.token = node.getToken();
        throw error;
      }
    }
  });

  return result;
};

let processNegatableTerm = function processNegatableTerm(nodeArg, singleUnderscoreVariableSet) {
  let node = nodeArg;
  if (node.getType() === NodeTypes.Cut) {
    // it's a cut
    return new Functor('cut', []);
  }
  let isNegated = false;
  while (node.getType() === NodeTypes.Negation) {
    node = node.getChildren()[0];
    isNegated = !isNegated;
  }
  let term = processLiteral(node, singleUnderscoreVariableSet);
  if (isNegated) {
    term = new Functor('!', [term]);
  }
  return term;
};

let processTimable = function processTimable(node, singleUnderscoreVariableSet) {
  let children = node.getChildren();
  let goal = children.shift();
  goal = processNegatableTerm(goal, singleUnderscoreVariableSet);
  let parameters = processArguments(children, singleUnderscoreVariableSet);
  let startTime = parameters[0];
  let endTime = parameters[0];
  if (parameters.length > 1) {
    endTime = parameters[1];
  }
  return new Timable(goal, startTime, endTime);
};

processLiteral = function (node, singleUnderscoreVariableSet) {
  switch (node.getType()) {
    case NodeTypes.Timable:
      return processTimable(node, singleUnderscoreVariableSet);
    case NodeTypes.Functor:
      return processFunctor(node, singleUnderscoreVariableSet);
    case NodeTypes.BinaryOperator:
      return processBinaryOperator(node, singleUnderscoreVariableSet);
    case NodeTypes.UnaryOperator:
      return processUnaryOperator(node, singleUnderscoreVariableSet);
    default: {
      let error = new Error();
      error.token = node.getToken();
      throw error;
    }
  }
};

let processLiteralSet = function processLiteralSet(literals, singleUnderscoreVariableSet) {
  let result = [];
  literals.forEach((node) => {
    let term = processNegatableTerm(node, singleUnderscoreVariableSet);
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
      properties.auxiliary.add(fact);
    });
    return;
  }

  if (children.length === 2
      && children[0].getToken().value === '<-') {
    // a constraint format
    properties.constraints
      .push(processConstraint(children[1].getChildren()));
    return;
  }

  // sanity check (2 literal sets and one operator)
  if (children.length !== 3
      || children[1].getType() !== NodeTypes.Symbol) {
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

function ProgramFactory() {}

ProgramFactory.build = function build(ast) {
  let program = new Program();
  let result = {
    constraints: [],
    rules: [],
    clauses: [],
    auxiliary: new LiteralTreeMap()
  };
  processProgramTree(ast, result);
  program.setConstraints(result.constraints);
  program.setClauses(result.clauses);
  program.setRules(result.rules);
  program.setFacts(result.auxiliary);
  return program;
};

ProgramFactory.literal = function literal(str) {
  let node = Parser.parseLiteral(str);
  let singleUnderscoreVariableSet = {
    next: 0,
    set: {}
  };
  return processFunctor(node, singleUnderscoreVariableSet);
};

ProgramFactory.literalSet = function literalSet(str) {
  let node = Parser.parseConjunction(str);
  let singleUnderscoreVariableSet = {
    next: 0,
    set: {}
  };
  return processLiteralSet(node.getChildren(), singleUnderscoreVariableSet);
};

ProgramFactory.fromString = function fromString(source) {
  return new Promise((resolve, reject) => {
    let token;
    try {
      let parser = new Parser(source);
      token = parser.build();
      let program = ProgramFactory.build(token);
      resolve(program);
    } catch (err) {
      let errorToken = err.token;
      if (errorToken === undefined
          || errorToken.line === undefined
          || errorToken.col === undefined) {
        reject(err);
        return;
      }
      errorToken.file = '(string)';
      let errorMessage = unexpectedTokenErrorMessage(source, errorToken, err.likelyMissing);
      reject(new Error(errorMessage));
    }
  });
};

ProgramFactory.fromFile = function fromFile(pathname) {
  return new Promise((resolve, reject) => {
    if (process.browser) {
      reject(stringLiterals.error('browserContext.loadProgramFromFile'));
      return;
    }
    fs.readFile(pathname, 'utf8', (fsErr, source) => {
      if (fsErr) {
        reject(fsErr);
        return;
      }
      let token;
      try {
        let parser = new Parser(source, pathname);
        token = parser.build();
        let program = ProgramFactory.build(token);
        resolve(program);
      } catch (err) {
        let errorToken = err.token;
        if (errorToken === undefined
            || errorToken.line === undefined
            || errorToken.col === undefined) {
          reject(err);
          return;
        }
        let errorMessage = unexpectedTokenErrorMessage(source, errorToken, err.likelyMissing);
        errorMessage = stringLiterals('parser.loadFileErrorHeader', [pathname, errorMessage]);
        reject(new Error(errorMessage));
      }
    });
  });
};

module.exports = ProgramFactory;
