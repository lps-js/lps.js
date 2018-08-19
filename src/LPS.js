/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const path = require('path');

global.lpsRequire = (name) => {
  // let pathname = path.join(__dirname, name);
  return require(`${__dirname}/${name}`);
};

const Program = lpsRequire('parser/Program');
const Engine = lpsRequire('engine/Engine');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const stringLiterals = lpsRequire('utility/strings');

function LPS() {

}

LPS.literal = function literal(str) {
  return Program.literal(str);
};

LPS.literalSet = function literalSet(str) {
  return Program.literalSet(str);
};

LPS.loadString = function loadString(source) {
  return Program.fromString(source)
    .then((program) => {
      let engine = new Engine(program);
      return engine.load();
    });
};

LPS.loadFile = function loadFile(fileArg) {
  if (process.browser) {
    return Promise.reject(new Error(stringLiterals('browserContext.loadProgramFromFile')));
  }
  let file = fileArg;
  file = path.resolve(file);
  return Program.fromFile(file)
    .then((program) => {
      let engine = new Engine(program, path.dirname(file));
      return engine.load();
    });
};

LPS.Value = Value;
LPS.Variable = Variable;
LPS.List = List;
LPS.Functor = Functor;

module.exports = LPS;
