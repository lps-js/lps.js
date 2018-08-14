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

LPS.loadFile = function loadFile(file) {
  if (process.browser) {
    return Promise.reject(new Error('Cannot load file in browser mode'));
  }
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
