const formattable = function (strArg, replacementsArg) {
  let replacements = replacementsArg;
  if (replacementsArg === undefined) {
    replacements = [];
  }

  let str = strArg;
  for (let idx in replacements) {
    str = str.replace(/[^%]{0,1}%s/, replacements[idx]);
  }
  return str;
};

const messages = {
  'modules': {
    'browserModeModuleLoadFailure': 'Not possible to use \'%s\' module when in browser'
  }
};

const invalidPathMessage = 'Invalid path for string literal retrival';
const nonStringLiteralPositionMessage = 'String literal retrival: Path does not point to a string';

module.exports = function (path, replacementsArg) {
  let replacements = replacementsArg;
  if (replacementsArg === undefined) {
    replacements = [];
  }

  let currentPosition = messages;
  for (let idx in path) {
    if (currentPosition[path[idx]] === undefined) {
      throw new Error(invalidPathMessage);
    }
    currentPosition = currentPosition[path[idx]];
  }

  if (typeof currentPosition !== 'string') {
    throw new Error(nonStringLiteralPositionMessage);
  }

  return formattable(currentPosition, replacements);
};
