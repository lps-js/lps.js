/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const stringLiterals = lpsRequire('utility/strings');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');

const fs = require('fs');
const path = require('path');

// eslint-disable-next-line no-unused-vars
module.exports = (engine, program) => {
  if (process.browser) {
    // in browserify mode
    throw new Error(stringLiterals(['modules', 'browserModeModuleLoadFailure'], ['fs']));
  }

  engine.define('fsFiles', (dir, fileVar) => {
    if (!(dir instanceof Value)) {
      throw new Error('fsFiles/2 does not support non-value in directory argument');
    }
    if (fileVar instanceof Value) {
      let filepath = path.join(dir.evaluate(), fileVar.evaluate());
      if (fs.existsSync(filepath)) {
        return [{ theta: {} }];
      }
      return [];
    }
    if (!(fileVar instanceof Variable)) {
      throw new Error('Invalid argument 2 provided for fsFiles/2, expecting variable or value.');
    }

    let varName = fileVar.evaluate();
    let files = fs.readdirSync(dir.evaluate());
    let result = files.map((file) => {
      let theta = {};
      theta[varName] = new Value(file);
      return { theta: theta };
    });
    return result;
  });
};
