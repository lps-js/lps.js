/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

module.exports = function lpsRequire(name) {
  return require(`${__dirname}/${name}`);
};
