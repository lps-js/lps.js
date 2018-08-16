/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const functors = {
  'write/1': function (term) {
    console.log(String(term));
    return [{ theta: {} }];
  }
};
module.exports = functors;
