/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

function AstNode(type, token) {
  let _type = type;
  let _token = token;
  let _children = [];

  this.getType = function getType() {
    return _type;
  };

  this.getToken = function getToken() {
    return _token;
  };

  this.getChildren = function getChildren() {
    return _children;
  };

  this.setToken = function setToken(t) {
    _token = t;
  };

  this.isLeaf = function isLeaf() {
    return _children.length === 0;
  };

  this.addChild = function addChild(childNode) {
    _children.push(childNode);
  };

  this.print = function print(nArg) {
    let n = nArg;
    if (!n) {
      n = 0;
    }
    console.log(' '.repeat(n) + String(_type) + (_token ? (': ' + _token.value) : ''));
    n += 1;
    _children.forEach((child) => {
      child.print(n);
    });
  };
}

module.exports = AstNode;
