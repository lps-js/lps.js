/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const path = require('path');

global.lpsRequire = (name) => {
  return require(path.join(__dirname, '../src', name));
};
