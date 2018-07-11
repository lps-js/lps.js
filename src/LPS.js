const Program = require('./parser/Program');
const Engine = require('./engine/Engine');
const Value = require('./engine/Value');
const Variable = require('./engine/Variable');

function LPS() {

}

LPS.literal = function literal(str) {
  return Program.literal(str);
};

LPS.load = function load(file) {
  return new Promise((resolve) => {
    Program.fromFile(file)
      .then((program) => {
        let engine = new Engine(program);
        engine.on('ready', () => {
          resolve(engine);
        });
      });
  });
};

LPS.Value = Value;
LPS.Variable = Variable;

module.exports = LPS;
