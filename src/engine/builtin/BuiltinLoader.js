/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Consult = lpsRequire('engine/builtin/Consult');
const Program = lpsRequire('parser/Program');
const path = require('path');

const builtinFiles = [
  'declarations',
  'math',
  'list'
];

// loads a set of built-in clauses
let loadBuiltinFiles = function loadBuiltinFiles(consult, program) {
  let loadingPromises = [];

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
      promise = consult.consultFile(filepath);
    }
    loadingPromises.push(promise);
  };

  builtinFiles.forEach(loadFile);

  return Promise.all(loadingPromises)
    .then(() => Promise.resolve(consult));
};

function BuiltinLoader() {
}

BuiltinLoader.load = function load(engine, program) {
  let consult = new Consult(engine, program);
  return loadBuiltinFiles(consult, program);
};

module.exports = BuiltinLoader;
