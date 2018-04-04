const Parser = require('./src/parser/Parser');
const Engine = require('./src/engine/Engine');

Parser.parseFile('examples/fire2.lps')
  .then((root) => {
    let engine = new Engine(root);
    let result = engine.run();
    result.forEach((e) => {
      console.log(e);
    });
  });
