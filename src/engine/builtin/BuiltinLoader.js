const Consult = lpsRequire('engine/builtin/Consult');
const Program = lpsRequire('parser/Program');
const path = require('path');

const builtinFiles = [
  'declarations',
  'math'
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
