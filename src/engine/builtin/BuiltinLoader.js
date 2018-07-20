const Consult = require('./Consult');
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

  return Promise.all(loadingPromises);
};

function BuiltinLoader() {
}

BuiltinLoader.load = function load(program) {
  let consult = new Consult(program);
  return loadBuiltinFiles(consult);
};

module.exports = BuiltinLoader;
