const Parser = require('./src/parser/Parser');
const Engine = require('./src/engine/Engine');

Parser.parseFile('examples/fireSimple.lps')
  .then((token) => {
    token.print();

    let engine = new Engine(token);
  });
