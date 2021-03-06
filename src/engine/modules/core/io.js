/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */
const lpsRequire = require('../../../lpsRequire');
const returnResults = lpsRequire('engine/modules/core/returnResults');

const functors = {
  'write/1': function (term) {
    process.stdout.write(String(term));
    return [returnResults.createTheta()];
  },
  'writeln/1': function (term) {
    process.stdout.write(String(term) + '\n');
    return [returnResults.createTheta()];
  }
};
module.exports = functors;
