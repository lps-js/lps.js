const path = require('path');

global.lpsRequire = (name) => {
  return require(path.join(__dirname, '../src', name));
};
