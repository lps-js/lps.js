const Parser = require('./src/parser/Parser');
const Engine = require('./src/engine/Engine');

Parser.parseFile('examples/fireSimple.lps')
  .then((root) => {
    let engine = new Engine(root);
    let result = engine.run();
    console.log(JSON.stringify(result));
  });
