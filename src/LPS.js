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
      return new Promise((resolve) => {
        let engine = new Engine(program);
        engine.on('ready', () => {
          resolve(engine);
        });
      });
    });
};

LPS.loadFile = function loadFile(file) {
  // TODO: consider browser context
  if (process.browser) {
    throw new Error('Cannot load file in browser mode');
  }
  return Program.fromFile(file)
    .then((program) => {
      return new Promise((resolve) => {
        let engine = new Engine(program, path.dirname(file));
        engine.on('ready', () => {
          resolve(engine);
        });
      });
    });
};

LPS.Value = Value;
LPS.Variable = Variable;
LPS.List = List;
LPS.Functor = Functor;

module.exports = LPS;
