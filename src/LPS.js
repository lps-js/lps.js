const Program = require('./parser/Program');
const Engine = require('./engine/Engine');

function LPS() {

}

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

module.exports = LPS;
