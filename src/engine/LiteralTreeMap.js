/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const Functor = lpsRequire('engine/Functor');
const Timable = lpsRequire('engine/Timable');
const List = lpsRequire('engine/List');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');

function _TreeLoaderType() {}

function deepCopy(obj) {
  if (obj instanceof Array) {
    return obj.map(x => deepCopy(x));
  }
  return obj;
}

function _TreeNode(size, tree) {
  this._size = size;
  this._tree = tree;

  if (this._size === undefined) {
    this._size = 0;
  }

  if (this._tree === undefined) {
    this._tree = {};
  }

  this.clone = function clone() {
    let cloneNode = new _TreeNode(this._size, {});
    this.indices().forEach((index) => {
      let childNode = this._tree[index];
      if (childNode instanceof _TreeNode) {
        cloneNode._tree[index] = childNode.clone();
        return;
      }
      cloneNode._tree[index] = deepCopy(childNode);
    });
    return cloneNode;
  };

  this.indices = function () {
    let indices = Object.getOwnPropertySymbols(this._tree)
      .concat(Object.getOwnPropertyNames(this._tree));
    return indices;
  };
}

let recursivelyGetLeafNodes = (currentNode) => {
  if (!(currentNode instanceof _TreeNode)) {
    return [currentNode];
  }
  let result = [];
  currentNode.indices().forEach((idx) => {
    result = result.concat(recursivelyGetLeafNodes(currentNode._tree[idx]));
  });
  return result;
};

let createSubtreeIfNotExist = (nArg, subtree) => {
  let n = nArg;
  if (n._tree[subtree] === undefined) {
    n._size += 1;
    n._tree[subtree] = new _TreeNode();
  }
};

function LiteralTreeMap() {
  let _root = new _TreeNode();
  let _count = 0;

  // only create an argument tree when needed otherwise we incur infinite loop
  let _argumentTreeSymbol = null;
  let _argumentClauses = {};
  let _variableMapping = {};
  let _numericMapping = {};

  this.add = function add(literal, valueArg) {
    let node = _root;
    let value = valueArg;
    if (value === undefined) {
      value = literal;
    }

    let args = literal;

    if (literal instanceof List) {
      args = literal.flatten();
    } else if (literal instanceof Functor || literal instanceof Timable) {
      createSubtreeIfNotExist(node, literal.getName());
      node = node._tree[literal.getName()];
      args = literal.getArguments();
    }

    let lastNodeRep = args.length;
    createSubtreeIfNotExist(node, args.length);
    if (args.length === 0) {
      _count += 1;
      node._size += 1;
      node._tree[lastNodeRep] = value;
      return;
    }

    args.forEach((arg, idx) => {
      node = node._tree[lastNodeRep];
      let nodeRep = null;
      let argIsValue = arg instanceof Value;
      let argIsVariable = arg instanceof Variable;

      if (!argIsValue && !argIsVariable) {
        // use another tree to index this argument
        if (_argumentTreeSymbol === null) {
          _argumentTreeSymbol = new LiteralTreeMap();
        } else {
          nodeRep = _argumentTreeSymbol.get(arg);
        }
        if (nodeRep === null) {
          nodeRep = Symbol();
          _argumentClauses[nodeRep] = arg;
          _argumentTreeSymbol.add(arg, nodeRep);
        }
      } else if (argIsVariable) {
        // variable part
        let varName = arg.evaluate();
        // we need to recognise variables that are used again and bind them together
        if (_variableMapping[varName] === undefined) {
          let varSymbol = Symbol('var:' + varName);
          _variableMapping[varName] = varSymbol;
        }
        nodeRep = _variableMapping[varName];
      } else {
        nodeRep = arg.evaluate();

        // handle numbers
        if (typeof nodeRep === 'number') {
          if (_numericMapping[String(nodeRep)] === undefined) {
            let numSymbol = Symbol('num:' + nodeRep);
            _numericMapping[String(nodeRep)] = numSymbol;
            nodeRep = numSymbol;
          } else {
            nodeRep = _numericMapping[String(nodeRep)];
          }
        }
      }
      lastNodeRep = nodeRep;
      if (idx === args.length - 1) {
        return;
      }

      createSubtreeIfNotExist(node, nodeRep);
    });

    if (node._tree[lastNodeRep] !== undefined) {
      // replacement
      node._tree[lastNodeRep] = value;
      return;
    }

    // do not increment counts for replacement
    _count += 1;
    node._size += 1;
    node._tree[lastNodeRep] = value;
  };

  let flattenLiteral = function flattenLiteral(literal) {
    let args = literal;
    let result = [];
    if (literal instanceof Functor || literal instanceof Timable) {
      result.push(literal.getName());
      args = literal.getArguments();
    }
    result.push(args.length);
    result = result.concat(args);
    return result;
  };

  let buildGetIndexPath = function buildGetIndexPath(literal) {
    let args = literal;
    let path = [];
    if (literal instanceof List) {
      args = literal.flatten();
    } else if (literal instanceof Functor || literal instanceof Timable) {
      path.push(literal.getName());
      args = literal.getArguments();
    }
    path.push(args.length);

    for (let i = 0; i < args.length; i += 1) {
      let arg = args[i];
      let nodeRep = null;
      if (!(arg instanceof Value) && !(arg instanceof Variable)) {
        // use another tree to index this argument
        if (_argumentTreeSymbol === null) {
          return null;
        }
        nodeRep = _argumentTreeSymbol.get(arg);
        if (nodeRep === null) {
          return null;
        }
      } else if (arg instanceof Variable) {
        let varName = arg.evaluate();
        if (_variableMapping[varName] === undefined) {
          return null;
        }
        nodeRep = _variableMapping[varName];
      } else {
        nodeRep = arg.evaluate();

        // handle numbers
        if (typeof nodeRep === 'number') {
          if (_numericMapping[String(nodeRep)] === undefined) {
            return null;
          }
          nodeRep = _numericMapping[String(nodeRep)];
        }
      }

      path.push(nodeRep);
    }
    return path;
  };

  this.get = function get(literal) {
    let path = buildGetIndexPath(literal);
    if (path === null) {
      return null;
    }

    let lastPathIndex = path.length - 1;
    let recursiveGet = (node, i) => {
      if (i >= path.length) {
        return null;
      }
      if (node._size === 0) {
        return null;
      }
      let index = path[i];
      if (node._tree[index] === undefined) {
        return null;
      }
      if (i === lastPathIndex) {
        return node._tree[index];
      }

      return recursiveGet(node._tree[index], i + 1);
    };
    return recursiveGet(_root, 0);
  };

  this.contains = function contains(literal) {
    let path = buildGetIndexPath(literal);
    if (path === null) {
      return false;
    }

    let lastPathIndex = path.length - 1;
    let recursiveCheck = (node, i) => {
      if (i >= path.length) {
        return false;
      }
      if (node._size === 0) {
        return false;
      }
      let index = path[i];
      if (node._tree[index] === undefined) {
        return false;
      }
      if (i === lastPathIndex) {
        return true;
      }

      return recursiveCheck(node._tree[index], i + 1);
    };
    return recursiveCheck(_root, 0);
  };

  this.remove = function remove(literal) {
    let path = buildGetIndexPath(literal);
    if (path === null) {
      return false;
    }

    let lastPathIndex = path.length - 1;
    let recursiveRemove = (nodeArg, i) => {
      let node = nodeArg;
      if (i >= path.length) {
        return false;
      }
      if (node._size === 0) {
        return false;
      }
      let index = path[i];
      if (node._tree[index] === undefined) {
        return false;
      }
      if (i === lastPathIndex) {
        // only reduce count at root node
        _count -= 1;
        delete node._tree[index];
        return true;
      }

      let result = recursiveRemove(node._tree[index], i + 1);
      if (result) {
        node._tree[index]._size -= 1;
        if (node._tree[index]._size === 0) {
          delete node._tree[index];
          return true;
        }
      }
      return false;
    };
    let lastCount = _count;
    recursiveRemove(_root, 0);
    return _count < lastCount;
  };

  this.clear = function clear() {
    _root = new _TreeNode();
    _count = 0;
    _argumentTreeSymbol = null;
    _argumentClauses = {};
  };

  this.size = function size() {
    return _count;
  };

  this.toArray = function toArray() {
    let result = [];

    let recursiveBuild = (node) => {
      if (!(node instanceof _TreeNode)) {
        result.push(node);
        return;
      }
      node.indices()
        .forEach((key) => {
          recursiveBuild(node._tree[key]);
        });
    };
    recursiveBuild(_root);
    return result;
  };

  this.forEach = function forEach(callback) {
    let recursiveTraverse = (node) => {
      if (node instanceof Functor
          || node instanceof Timable
          || node instanceof Array) {
        callback(node);
        return;
      }
      node.indices()
        .forEach((key) => {
          recursiveTraverse(node._tree[key]);
        });
    };
    recursiveTraverse(_root);
  };

  let extractSymbolContent = (symbol) => {
    let symbolName = symbol.toString();
    return symbolName.substring(11, symbolName.length - 1);
  };

  let unifyForValue = (value, path, node, recursiveCall, externalThetaArg, internalThetaArg) => {
    let externalTheta = externalThetaArg;
    let internalTheta = internalThetaArg;
    let result = [];
    let subResult;
    node.indices().forEach((index) => {
      // index is not a number, variable, functor or list
      if (value === index) {
        subResult = recursiveCall(path, node._tree[index], externalTheta, internalTheta);
        result = result.concat(subResult);
        return;
      }
      let isSymbol = typeof index === 'symbol';

      // index must be a symbol (representing number, variable, functor or list)
      if (!isSymbol) {
        return;
      }

      let symName = index.toString();
      let isNumber = symName.indexOf('Symbol(num:') === 0;
      let isVariable = symName.indexOf('Symbol(var:') === 0;

      // we skip over lists and functors because
      // values cannot unify with lists / functors
      if (!isNumber && !isVariable) {
        return;
      }

      if (isNumber) {
        // it's a number
        let numValue = Number(extractSymbolContent(index));
        if (value === numValue) {
          // number match
          subResult = recursiveCall(path, node._tree[index], externalTheta, internalTheta);
          result = result.concat(subResult);
        }
        return;
      }

      // this is a variable
      let treeVarName = extractSymbolContent(index);
      if (internalTheta[treeVarName] !== undefined) {
        // already a substitution exists
        if (internalTheta[treeVarName].evaluate() === value) {
          subResult = recursiveCall(path, node._tree[index], externalTheta, internalTheta);
          result = result.concat(subResult);
        }
        return;
      }
      let clonedInternalTheta = Object.assign({}, internalTheta);
      clonedInternalTheta[treeVarName] = new Value(value);
      subResult = recursiveCall(path, node._tree[index], externalTheta, clonedInternalTheta);
      result = result.concat(subResult);
    });
    return result;
  }; // unifyForValue

  let unifyForComplexTerm = (
    term,
    path,
    node,
    recursiveCall,
    externalThetaArg,
    internalThetaArg
  ) => {
    let externalTheta = externalThetaArg;
    let internalTheta = internalThetaArg;

    let result = [];
    let subResult;

    // complex terms
    if (_argumentTreeSymbol !== null) {
      // there are some complex terms stored in this tree
      // which we need to go through to find any matches
      subResult = _argumentTreeSymbol.unifies(term, internalTheta);
      subResult.forEach((entry) => {
        // combine theta
        let tempExternalTheta = Object.assign({}, externalTheta);
        let tempInternalTheta = Object.assign({}, internalTheta);
        Object.keys(entry.theta).forEach((k) => {
          tempExternalTheta[k] = entry.theta[k];
        });
        Object.keys(entry.internalTheta).forEach((k) => {
          tempInternalTheta[k] = entry.internalTheta[k];
        });
        if (term instanceof List
            && entry.tailVariable !== undefined) {
          // handle tail theta
          entry.matchingTails.forEach((symbol) => {
            if (node._tree[symbol] === undefined) {
              return;
            }
            let list = _argumentClauses[symbol].flatten();
            list.splice(0, entry.headEaten);
            let matchingTailExternalTheta = Object.assign({}, tempExternalTheta);

            matchingTailExternalTheta[entry.tailVariable.evaluate()] = new List(list);
            subResult = recursiveCall(
              path,
              node._tree[symbol],
              matchingTailExternalTheta,
              tempInternalTheta
            );
            result = result.concat(subResult);
          });
          return;
        }
        if (node._tree[entry.leaf] === undefined) {
          return;
        }
        subResult = recursiveCall(
          path,
          node._tree[entry.leaf],
          tempExternalTheta,
          tempInternalTheta
        );
        result = result.concat(subResult);
      });
    } // has argumentTreeSymbol

    // otherwise we go through node to find some variables
    // for internal substitution
    node.indices().forEach((index) => {
      let clonedInternalTheta;
      if (node._tree[index] === undefined) {
        return;
      }
      let isSymbol = typeof index === 'symbol';
      if (!isSymbol) {
        // index is not a variable, functor or list
        return;
      }
      let symName = index.toString();
      let isVariable = symName.indexOf('Symbol(var:') === 0;
      if (!isVariable) {
        // it's a not variable
        return;
      }
      let treeVarName = symName.substring(11, symName.length - 1);
      if (internalTheta[treeVarName] !== undefined) {
        // previously internally substituted.
        if (!(internalTheta[treeVarName] instanceof Functor)
            && !(internalTheta[treeVarName] instanceof List)
            && !(internalTheta[treeVarName] instanceof Timable)) {
          return;
        }
        let unifyTree = new LiteralTreeMap();
        unifyTree.add(internalTheta[treeVarName]);
        subResult = unifyTree.unifies(term);
        if (subResult.length > 0) {
          subResult = recursiveCall(path, node._tree[index], externalTheta, internalTheta);
          result = result.concat(subResult);
        }
        return;
      }
      clonedInternalTheta = Object.assign({}, internalTheta);
      clonedInternalTheta[treeVarName] = term;
      subResult = recursiveCall(path, node._tree[index], externalTheta, clonedInternalTheta);
      result = result.concat(subResult);
    });
    return result;
  }; // unifyForComplexTerm

  let recursiveUnification = (pathArg, node, externalThetaArg, internalThetaArg) => {
    let path = pathArg.concat();
    let externalTheta = externalThetaArg;
    let internalTheta = internalThetaArg;
    if (path.length === 0) {
      return [{
        theta: externalTheta,
        internalTheta: internalTheta,
        leaf: node
      }];
    }

    // extract current key out
    let currentKey = path.shift();
    let currentKeyType = typeof currentKey;

    // current key can be determined immediately
    if (currentKeyType === 'string'
        || currentKeyType === 'number') {
      if (node._tree[currentKey] === undefined) {
        // key not found at this point
        return [];
      }
      return recursiveUnification(path, node._tree[currentKey], externalTheta, internalTheta);
    }

    if (currentKey instanceof Value) {
      return unifyForValue(
        currentKey.evaluate(),
        path,
        node,
        recursiveUnification,
        externalTheta,
        internalTheta
      );
    }

    let result = [];
    let subResult;

    if (currentKey instanceof Variable) {
      let varName = currentKey.evaluate();
      if (externalTheta[varName] !== undefined) {
        // substituted earlier on
        if (externalTheta[varName] instanceof Functor
            || externalTheta[varName] instanceof Timable
            || externalTheta[varName] instanceof List) {
          return unifyForComplexTerm(
            externalTheta[varName],
            path,
            node,
            recursiveUnification,
            externalTheta,
            internalTheta
          );
        }
        return unifyForValue(
          externalTheta[varName].evaluate(),
          path,
          node,
          recursiveUnification,
          externalTheta,
          internalTheta
        );
      } // previously substituted

      node.indices().forEach((index) => {
        let subtree = node._tree[index];
        if (subtree === undefined) {
          return;
        }
        let isSymbol = typeof index === 'symbol';
        let clonedInternalTheta;
        let clonedExternalTheta;

        // value is not a number, variable, functor or list
        if (!isSymbol) {
          // variable vs simple values
          clonedExternalTheta = Object.assign({}, externalTheta);
          clonedExternalTheta[varName] = new Value(index);
          subResult = recursiveUnification(path, subtree, clonedExternalTheta, internalTheta);
          result = result.concat(subResult);
          return;
        }
        let symName = index.toString();
        let isNumber = symName.indexOf('Symbol(num:') === 0;
        let isVariable = symName.indexOf('Symbol(var:') === 0;

        if (isNumber) {
          // variable vs number
          let numValue = Number(extractSymbolContent(index));
          clonedExternalTheta = Object.assign({}, externalTheta);
          clonedExternalTheta[varName] = new Value(numValue);
          subResult = recursiveUnification(path, subtree, clonedExternalTheta, internalTheta);
          result = result.concat(subResult);
          return;
        }

        if (isVariable) {
          // variable vs variable
          let treeVarName = extractSymbolContent(index);
          // we perform internal substitution over external if it's variable vs variable
          clonedInternalTheta = Object.assign({}, internalTheta);
          clonedExternalTheta = Object.assign({}, externalTheta);
          if (internalTheta[treeVarName] === undefined) {
            if (externalTheta[varName] === undefined) {
              clonedInternalTheta[treeVarName] = new Variable(varName);
            } else {
              clonedInternalTheta[treeVarName] = externalTheta[varName];
            }
          } else {
            clonedExternalTheta[varName] = internalTheta[treeVarName];
          }
          subResult = recursiveUnification(path, subtree, clonedExternalTheta, clonedInternalTheta);
          result = result.concat(subResult);
          return;
        }

        // variable vs complex terms
        let term = _argumentClauses[index];
        clonedExternalTheta = Object.assign({}, externalTheta);
        let substitutedTerm = term;
        if (term instanceof Functor || term instanceof List) {
          substitutedTerm = substitutedTerm.substitute(internalTheta);
        }
        clonedExternalTheta[varName] = substitutedTerm;
        subResult = recursiveUnification(path, subtree, clonedExternalTheta, internalTheta);
        result = result.concat(subResult);
      });

      return result;
    } // variable

    if (!(currentKey instanceof Functor)
        && !(currentKey instanceof Timable)
        && !(currentKey instanceof List)) {
      // here, i have no idea what you have passed in
      return [];
    }

    subResult = unifyForComplexTerm(
      currentKey,
      path,
      node,
      recursiveUnification,
      externalTheta,
      internalTheta
    );
    result = result.concat(subResult);

    return result;
  }; // recursiveUnification

  this.unifies = function unifies(literal, existingThetaArg) {
    let existingTheta = existingThetaArg;
    if (existingTheta === undefined) {
      existingTheta = {};
    }

    if (!(literal instanceof Functor)
        && !(literal instanceof Timable)
        && !(literal instanceof List)) {
      throw new Error('Literal given for unification must be a functor, timable or list');
    }

    if (literal instanceof List) {
      let subResult;

      let buildListPath = (list, remainingLength) => {
        let listHead = list.getHead();
        if (listHead.length > remainingLength) {
          return null;
        }
        let listTail = list.getTail();
        if (listTail instanceof List) {
          let sublist = buildListPath(listTail, remainingLength - listHead.length);
          if (sublist === null) {
            return {
              list: listHead,
              tail: listTail
            };
          }
          return {
            list: listHead.concat(sublist.list),
            tail: sublist.tail
          };
        }

        let result = {
          list: [].concat(listHead),
          tail: null
        };
        if (listTail instanceof Variable) {
          result.tail = listTail;
        }
        return result;
      };

      let paths = [];
      _root.indices().forEach((idxArg) => {
        let len = Number(idxArg);
        if (Number.isNaN(len)) {
          return;
        }
        let pathTuple = buildListPath(literal, len);
        if (pathTuple === null) {
          return;
        }
        let path = pathTuple.list;
        paths.push({
          idx: idxArg,
          path: path,
          tail: pathTuple.tail
        });
      });

      let result = [];
      paths.forEach((tuple) => {
        if (_root._tree[tuple.idx] === undefined) {
          return;
        }
        let pathLength = tuple.path.length;
        subResult = recursiveUnification(tuple.path, _root._tree[tuple.idx], {}, existingTheta, {});
        if (tuple.tail !== null) {
          subResult = subResult.map((pairArg) => {
            let pair = pairArg;
            let leafNodes = recursivelyGetLeafNodes(pair.leaf);
            pair.headEaten = pathLength;
            pair.tailVariable = tuple.tail;
            pair.matchingTails = leafNodes;
            return pair;
          });
        }
        // process tails for each subResult

        result = result.concat(subResult);
      });
      return result;
    } // literal given is list

    let path = flattenLiteral(literal);
    return recursiveUnification(path, _root, {}, existingTheta, {});
  }; // unifies

  this.clone = function clone() {
    if (this instanceof _TreeLoaderType) {
      return (tree) => {
        _count = tree.count;
        _root = tree.root.clone();
        _argumentTreeSymbol = null;
        _numericMapping = Object.assign({}, tree.numericMapping);
        _variableMapping = Object.assign({}, tree.variableMapping);
        _argumentClauses = {};
        _argumentClauses = Object.assign({}, tree.argumentClauses);
        if (tree.argumentTree !== null) {
          _argumentTreeSymbol = tree.argumentTree.clone();
        }
      };
    }
    let _clone = new LiteralTreeMap();
    let loader = _clone.clone.call(new _TreeLoaderType());
    loader({
      root: _root,
      count: _count,
      argumentTree: _argumentTreeSymbol,
      argumentClauses: _argumentClauses,
      variableMapping: _variableMapping,
      numericMapping: _numericMapping
    });
    return _clone;
  };
}

module.exports = LiteralTreeMap;
