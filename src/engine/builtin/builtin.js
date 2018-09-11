/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */
const lpsRequire = require('../../lpsRequire');
const Program = lpsRequire('engine/Program');
const Value = lpsRequire('engine/Value');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const path = require('path');

const builtinFiles = [
  'declarations',
  'math',
  'list',
  'types'
];

const consultTerm = ProgramFactory.literal('consult(File)');

let builtInCache = {};

// loads a set of built-in clauses
function builtinProcessor(engine, program) {
  let loadingPromises = [];

  let loadFile = (filename) => {
    if (builtInCache[filename] !== undefined) {
      program.augment(builtInCache[filename]);
      return;
    }
    let promise;
    if (process.browser) {
      let source = require(`${__dirname}/${filename}.lps`);
      promise = ProgramFactory.fromString(source)
        .then((p) => {
          builtInCache[filename] = p;
          program.augment(p);
          return Promise.resolve();
        });
    } else {
      let filepath = path.join(__dirname, filename + '.lps');
      let theta = {
        File: new Value(filepath)
      };
      program.getFacts()
        .add(consultTerm.substitute(theta));
      promise = Promise.resolve();
    }
    loadingPromises.push(promise);
  };

  builtinFiles.forEach(loadFile);

  return Promise.all(loadingPromises);
}

module.exports = builtinProcessor;
