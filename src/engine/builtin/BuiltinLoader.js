/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Consult = lpsRequire('engine/processors/Consult');
const Program = lpsRequire('engine/Program');
const path = require('path');

const builtinFiles = [
  'declarations',
  'math',
  'list'
];

// loads a set of built-in clauses
let loadBuiltinFiles = function loadBuiltinFiles(engine, program) {
  let loadingPromises = [];

  let consultProcessor;
  if (!process.browser) {
    consultProcessor = new Consult(engine, program);
  }

  let loadFile = (filename) => {
    let promise;
    if (process.browser) {
      let source = require(`${__dirname}/${filename}.lps`);
      promise = Program.fromString(source)
        .then((p) => {
          program.augment(p);
          return Promise.resolve();
        });
    } else {
      let filepath = path.join(__dirname, filename + '.lps');
      promise = consultProcessor.consultFile(filepath);
    }
    loadingPromises.push(promise);
  };

  builtinFiles.forEach(loadFile);

  return Promise.all(loadingPromises);
};

function BuiltinLoader() {
}

BuiltinLoader.load = function load(engine, program) {
  return loadBuiltinFiles(engine, program);
};

module.exports = BuiltinLoader;
