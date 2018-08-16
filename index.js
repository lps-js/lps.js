/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const LPS = require('./src/LPS');
const meta = require('./package.json');
LPS.meta = meta;

if (process.browser) {
  window.LPS = LPS;
}

module.exports = LPS;
