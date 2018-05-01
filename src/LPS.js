const Parser = require('./parser/Parser');
const Engine = require('./engine/Engine');

function LPS() {

}

LPS.load = function load(file) {
  return new Promise((resolve) => {
    Parser.parseFile(file)
      .then((root) => {
        let engine = new Engine(root);
        resolve(engine);
      });
  });
}

module.exports = LPS;
