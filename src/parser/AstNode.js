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

  this.setToken = function setToken(token) {
    _token = token;
  };

  this.isLeaf = function isLeaf() {
    return _children.length === 0;
  };

  this.addChild = function addChild(childNode) {
    _children.push(childNode);
  };

  this.print = function print(n) {
    if (!n) {
      n = 0;
    }
    console.log(' '.repeat(n) + String(_type) + (_token ? (': ' + _token.value) : ''));
    _children.forEach((child) => {
      child.print(n + 1);
    });
  };
}

module.exports = AstNode;
