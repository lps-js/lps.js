/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const LPS = require('./src/LPS');
const meta = require('./package.json');

// set the metadata to LPS.meta
// you can get the version number of lps.js from 'LPS.meta.version'
LPS.meta = meta;

if (process.browser) {
  // if it is in browser mode,
  // set LPS to be a globally available identifier
  window.LPS = LPS;
}

// export the main LPS type
module.exports = LPS;
