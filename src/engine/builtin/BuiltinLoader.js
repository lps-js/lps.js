const Consult = lpsRequire('engine/builtin/Consult');
const path = require('path');

const builtinFiles = [
  'declarations',
  'math'
];

// loads a set of built-in clauses
let loadBuiltinFiles = function loadBuiltinFiles(consult) {
  let loadingPromises = [];

  builtinFiles.forEach((filename) => {
    let filepath = path.join(__dirname, filename + '.lps');
    loadingPromises.push(consult.consultFile(filepath));
  });

  return Promise.all(loadingPromises)
    .then(() => Promise.resolve(consult));
};

function BuiltinLoader() {
}

BuiltinLoader.load = function load(engine, program) {
  let consult = new Consult(engine, program);
  return loadBuiltinFiles(consult);
};

module.exports = BuiltinLoader;
