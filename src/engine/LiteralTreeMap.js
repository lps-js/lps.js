const Functor = require('./Functor');
const List = require('./List');
const Value = require('./Value');
const Variable = require('./Variable');

function __TreeLoaderType() {}

function deepCopy(obj) {
  if (obj instanceof Array) {
    return obj.map(x => deepCopy(x));
  }
  return obj;
}

function __TreeNode(size, tree) {
  this._size = size;
  this._tree = tree;

  if (this._size === undefined) {
    this._size = 0;
  }

  if (this._tree === undefined) {
    this._tree = {};
  }

  this.clone = function() {
    let clone = new __TreeNode(size, {});
    this.indices().forEach((index) => {
      if (this._tree[index] instanceof __TreeNode) {
        clone._tree[index] = this._tree[index].clone();
        return ;
      }
      clone._tree[index] = deepCopy(this._tree[index]);
    });
    return clone;
  };

  this.indices = function indices() {
    let indices = Object.getOwnPropertySymbols(this._tree)
      .concat(Object.getOwnPropertyNames(this._tree));
    return indices;
  };
}

let recursivelyGetLeafNodes = (currentNode) => {
  if (!(currentNode instanceof __TreeNode)) {
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
    n._tree[subtree] = new __TreeNode();
  }
};

function LiteralTreeMap() {
  let _root = new __TreeNode();
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
    } else if (literal instanceof Functor) {
      createSubtreeIfNotExist(node, literal.getName());
      node = node._tree[literal.getName()];
      args = literal.getArguments();
    }
    let lastNodeRep = args.length;
    createSubtreeIfNotExist(node, args.length);

    args.forEach((arg, idx) => {
      node = node._tree[lastNodeRep];
      let nodeRep = null;
      if (!(arg instanceof Value) && !(arg instanceof Variable)) {
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
      } else if (arg instanceof Variable) {
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
    if (literal instanceof Functor) {
      result.push(literal.getName());
      args = literal.getArguments();
    }
    result.push(args.length);
    result = result.concat(args);
    return result
  };

  let buildGetIndexPath = function buildGetIndexPath(literal) {
    let args = literal;
    let path = [];
    if (literal instanceof List) {
      args = literal.flatten();
    } else if (literal instanceof Functor) {
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
        delete node._tree[index];
        return true;
      }

      let result = recursiveRemove(node._tree[index], i + 1);
      if (result) {
        node._tree[index]._size -= 1;
        if (node._tree[index]._size === 0) {
          _count -= 1;
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
    _root = new __TreeNode();
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
      if (node instanceof Functor || node instanceof Array) {
        result.push(node);
        return;
      }
      let indices = node.indices();
      indices.forEach((key) => {
        recursiveBuild(node._tree[key]);
      });
    };
    recursiveBuild(_root);
    return result;
  };

  this.forEach = function forEach(callback) {
    let recursiveTraverse = (node) => {
      if (node instanceof Functor || node instanceof Array) {
        callback(node);
        return;
      }
      let indices = node.indices();
      indices.forEach((key) => {
        recursiveTraverse(node._tree[key]);
      });
    };
    recursiveTraverse(_root);
  };

  this.unifies = function unifies(literal, existingThetaArg) {
    let existingTheta = existingThetaArg;
    if (existingTheta === undefined) {
      existingTheta = {};
    }

    if (!(literal instanceof Functor) && !(literal instanceof List)) {
      throw new Error('Literal is not a functor or list');
    }

    let recursiveUnification = (path, node, i, thetaArg) => {
      let theta = thetaArg;
      if (i >= path.length) {
        return [ {theta: theta, leaf: node } ];
      }

      // make a copy of theta in case back tracking
      let newTheta;
      let result = [];
      let subResult;

      let current = path[i];
      let currentType = typeof current;
      if (currentType === 'string' || currentType === 'number') {
        if (node._tree[current] === undefined) {
          return [];
        }
        return recursiveUnification(path, node._tree[current], i + 1, theta);;
      }

      let cloneTheta = () => {
        newTheta = {};
        Object.keys(theta).forEach((key) => {
          newTheta[key] = theta[key];
        });
      };

      let unifyForValue = (value) => {
        node.indices().forEach((index) => {
          // index is not a variable, functor or list
          if (value === index) {
            subResult = recursiveUnification(path, node._tree[index], i + 1, theta);
            result = result.concat(subResult);
            return;
          }
          if (typeof index !== 'symbol') {
            return;
          }
          let symName = index.toString();
          if (symName.indexOf('Symbol(num:') === 0) {
            // it's a number
            let numValue = Number(symName.substring(11, symName.length - 1));
            if (value === numValue) {
              subResult = recursiveUnification(path, node._tree[index], i + 1, theta);
              result = result.concat(subResult);
            }
            return;
          }
          if (symName.indexOf('Symbol(var:') !== 0) {
            // it's a not variable
            return;
          }
          let treeVarName = symName.substring(11, symName.length - 1);
          if (theta[treeVarName] !== undefined) {
            return;
          }
          cloneTheta();
          newTheta[treeVarName] = new Value(value);
          subResult = recursiveUnification(path, node._tree[index], i + 1, newTheta);
          result = result.concat(subResult);
        });
      };

      // the case of simple values
      if (current instanceof Value) {
        let value = current.evaluate();
        unifyForValue(value);
        return result;
      }

      // the case of variables
      if (current instanceof Variable) {
        let invertUnificationOrder = false;
        let varName = current.evaluate();

        if (theta[varName] !== undefined) {
          // a replacement for the this variable exists
          if (theta[varName] instanceof Variable) {
            theta[theta[varName].evaluate()] = new Variable(varName);
            invertUnificationOrder = true;
          } else {
            unifyForValue(theta[varName].evaluate());
            return result;
          }
        }

        node.indices().forEach((value) => {
          cloneTheta();
          // value is a number, variable, functor or list
          if (typeof value === 'symbol') {
            let symName = value.toString();
            if (symName.indexOf('Symbol(num:') === 0) {
              // it's a number
              let numValue = Number(symName.substring(11, symName.length - 1));
              newTheta[varName] = new Value(numValue);
              subResult = recursiveUnification(path, node._tree[value], i + 1, newTheta);
              result = result.concat(subResult);
              return;
            }
            if (symName.indexOf('Symbol(var:') === 0) {
              // it's a variable
              let treeVarName = symName.substring(11, symName.length - 1);
              if (invertUnificationOrder) {
                newTheta[treeVarName] = new Variable(varName);
              } else {
                newTheta[varName] = new Variable(treeVarName);
              }
              subResult = recursiveUnification(path, node._tree[value], i + 1, newTheta);
              result = result.concat(subResult);
              return;
            }
            let term = _argumentClauses[value];
            newTheta[varName] = term;
            subResult = recursiveUnification(path, node._tree[value], i + 1, newTheta);
            result = result.concat(subResult);
            return;
          }

          newTheta[varName] = new Value(value);
          subResult = recursiveUnification(path, node._tree[value], i + 1, newTheta);
          result = result.concat(subResult);
        });

        if (invertUnificationOrder) {
          result.forEach((sr) => {
            delete sr.theta[varName];
          });
        }
        return result;
      }

      // the case of complex terms
      if (current instanceof Functor || current instanceof List) {
        // some matching functors!
        if (_argumentTreeSymbol !== null) {
          // pass existing theta
          subResult = _argumentTreeSymbol.unifies(current, theta);
          subResult.forEach((entry) => {
            cloneTheta();
            // combine theta
            Object.keys(entry.theta).forEach((k) => {
              newTheta[k] = entry.theta[k];
            });
            if (current instanceof List && entry.tailVariable !== undefined) {
              // handle tail theta
              entry.matchingTails.forEach((symbol) => {
                if (node._tree[symbol] === undefined) {
                  return;
                }
                let list = _argumentClauses[symbol].flatten();
                list.splice(0, entry.headEaten);
                newTheta[entry.tailVariable.evaluate()] = new List(list);
                //console.log(newTheta);
                subResult = recursiveUnification(path, node._tree[symbol], i + 1, newTheta);
                result = result.concat(subResult);
              });
              return;
            }
            subResult = recursiveUnification(path, node._tree[entry.leaf], i + 1, newTheta);
            result = result.concat(subResult);
          });
        }
        // go through to find variables
        node.indices().forEach((value) => {
          // value is not a variable, functor or list
          if (typeof value !== 'symbol') {
            return;
          }
          let symName = value.toString();
          if (symName.indexOf('Symbol(var:') !== 0) {
            // it's a not variable
            return;
          }
          cloneTheta();
          let treeVarName = symName.substring(11, symName.length - 1);
          newTheta[treeVarName] = current;
          subResult = recursiveUnification(path, node._tree[value], i + 1, newTheta);
          result = result.concat(subResult);
        });
        return result;
      }

      return result;
    };

    if (literal instanceof List) {
      let listHead = literal.getHead();

      let buildListPath = (list, remainingLength) => {
        let listHead = list.getHead();
        //console.log(listHead.length, remainingLength);
        if (listHead.length > remainingLength) {
          return null;
        }
        let listTail = list.getTail();
        if (listTail instanceof List) {
          let sublist = buildListPath(listTail, remainingLength - listHead.length);
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
        if (isNaN(len)) {
          return;
        }
        let pathTuple = buildListPath(literal, len);
        if (pathTuple === null) {
          return;
        }
        let path = pathTuple.list;
        paths.push({ idx: idxArg, path: path, tail: pathTuple.tail });
      });

      let result = [];
      paths.forEach((tuple) => {
        subResult = recursiveUnification(tuple.path, _root._tree[tuple.idx], 0, existingTheta);
        if (tuple.tail !== null) {
          subResult = subResult.map((pairArg) => {
            let pair = pairArg;
            let leafNodes = recursivelyGetLeafNodes(pair.leaf);
            pair.headEaten = tuple.path.length;
            pair.tailVariable = tuple.tail;
            pair.matchingTails = leafNodes;
            return pair;
          });
        }
        // process tails for each subResult

        result = result.concat(subResult);
      });
      return result;
    }

    let path = flattenLiteral(literal);
    return recursiveUnification(path, _root, 0, existingTheta);
  };

  this.clone = function clone() {
    if (this instanceof __TreeLoaderType) {
      return (tree) => {
        _count = tree.count;
        _root = tree.root.clone();
        _argumentTreeSymbol = null;
        _argumentClauses = {};
        if (tree.argumentTree !== null) {
          _argumentTreeSymbol = tree.argumentTree.clone();
          Object.keys(tree.argumentClauses).forEach((key) => {
            _argumentClauses[key] = tree.argumentClauses[key];s
          });
        }
      }
    }
    let clone = new LiteralTreeMap()
    let loader = clone.clone.call(new __TreeLoaderType());
    loader({
      root: _root,
      count: _count,
      argumentTree: _argumentTreeSymbol,
      argumentClauses: _argumentClauses
    });
    return clone;
  };
}

module.exports = LiteralTreeMap;
