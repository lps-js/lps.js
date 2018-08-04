global.lpsRequire = name => require(`${__dirname}/${name}`);
const Program = lpsRequire('parser/Program');
const Engine = lpsRequire('engine/Engine');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');

const path = require('path');

function LPS() {

}

LPS.literal = function literal(str) {
  return Program.literal(str);
};

LPS.literalSet = function literalSet(str) {
  return Program.literalSet(str);
};

LPS.load = function load(file) {
  // TODO: consider browser context
  return new Promise((resolve) => {
    Program.fromFile(file)
      .then((program) => {
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
