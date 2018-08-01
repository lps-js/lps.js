global.lpsRequire = name => require(`${__dirname}/${name}`);
const Program = lpsRequire('parser/Program');
const Engine = lpsRequire('engine/Engine');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');

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

module.exports = LPS;
