/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const formattable = function (strArg, replacements) {
  let str = strArg;
  const keys = Object.keys(replacements);
  for (let i = 0; i < keys.length; i += 1) {
    str = str.replace(/%s/, replacements[keys[i]]);
  }
  return str;
};

const messages = lpsRequire('utility/strings/store.json');

const invalidPathMessage = 'Invalid path for string literal retrival';
const nonStringLiteralPositionMessage = 'String literal retrival: Path does not point to a string';

const stringLiterals = function (pathArg, replacementsArg) {
  let path = pathArg;
  if (typeof path === 'string') {
    path = path.split('.');
  }

  let replacements = replacementsArg;
  if (!(replacementsArg instanceof Array)) {
    replacements = Array.from(arguments).slice(1);
  } else if (replacementsArg === undefined) {
    replacements = [];
  }

  let currentPosition = messages;
  const keys = Object.keys(path);
  for (let i = 0; i < keys.length; i += 1) {
    if (currentPosition[path[keys[i]]] === undefined) {
      throw new Error(invalidPathMessage);
    }
    currentPosition = currentPosition[path[keys[i]]];
  }

  if (typeof currentPosition !== 'string') {
    throw new Error(nonStringLiteralPositionMessage);
  }

  return formattable(currentPosition, replacements);
};

stringLiterals.error = function stringLiteralsError() {
  return new Error(stringLiterals.apply(null, arguments));
};

module.exports = stringLiterals;
