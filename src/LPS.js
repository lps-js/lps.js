/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const path = require('path');

global.lpsRequire = (name) => {
  // let pathname = path.join(__dirname, name);
  return require(`${__dirname}/${name}`);
};

const ProgramFactory = lpsRequire('parser/ProgramFactory');
const Engine = lpsRequire('engine/Engine');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Functor = lpsRequire('engine/Functor');
const Tester = lpsRequire('engine/test/Tester');
const List = lpsRequire('engine/List');
const stringLiterals = lpsRequire('utility/strings');

const programArgsPredicate = ProgramFactory.literal('lpsArgs(L)');

function LPS() {

}

LPS.literal = function literal(str) {
  return ProgramFactory.literal(str);
};

LPS.literalSet = function literalSet(str) {
  return ProgramFactory.literalSet(str);
};

let buildProgramArgsPredicate = function (programArgs) {
  let _programArgs = programArgs;
  if (programArgs === undefined) {
    _programArgs = [];
  }
  // map to values
  _programArgs = _programArgs.map(arg => new Value(arg));
  let argsList = new List(_programArgs);
  let theta = {
    L: argsList
  };
  return programArgsPredicate.substitute(theta);
};

LPS.loadString = function loadString(source, programArgs) {
  return ProgramFactory.fromString(source)
    .then((program) => {
      let programArgsFact = buildProgramArgsPredicate(programArgs);
      program.getFacts().add(programArgsFact);
      let engine = new Engine(program);
      return engine.load();
    });
};

LPS.loadFile = function loadFile(fileArg, programArgs) {
  if (process.browser) {
    return Promise.reject(new Error(stringLiterals('browserContext.loadProgramFromFile')));
  }
  let file = fileArg;
  file = path.resolve(file);
  return ProgramFactory.fromFile(file)
    .then((program) => {
      program.setWorkingDirectory(path.dirname(file));
      let programArgsFact = buildProgramArgsPredicate(programArgs);
      program.getFacts().add(programArgsFact);
      let engine = new Engine(program);
      return engine.load();
    });
};

LPS.Value = Value;
LPS.Variable = Variable;
LPS.List = List;
LPS.Functor = Functor;
LPS.Tester = Tester;

module.exports = LPS;
