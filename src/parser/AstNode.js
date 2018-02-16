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

  this.isLeaf = function isLeaf() {
    return _children.length === 0;
  };

  this.addChild = function addChild(childNode) {
    _children.push(childNode);
  };
}

module.exports = AstNode;
