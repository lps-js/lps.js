const LPS = require('./src/LPS');
const Parser = require('./src/parser/Parser');
const Engine = require('./src/engine/Engine');

LPS.load('examples/towers.lps')
  .then((engine) => {
    let result = engine.run();
    console.log(JSON.stringify(result));
  });

module.exports = LPS;
