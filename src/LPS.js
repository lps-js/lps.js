const Program = require('./parser/Program');
const Engine = require('./engine/Engine');
const Value = require('./engine/Value');
const Variable = require('./engine/Variable');
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
