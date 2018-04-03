const Parser = require('./src/parser/Parser');
const Engine = require('./src/engine/Engine');

Parser.parseFile('examples/fire2.lps')
  .then((token) => {
    //token.print();

    let engine = new Engine(token);
    let result = engine.run();
    result.forEach((e) => {
      console.log(e);
    })
  });
