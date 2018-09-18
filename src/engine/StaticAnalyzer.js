/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const stringLiterals = lpsRequire('utility/strings');

const WARNING_EVENT = 'warning';

function StaticAnalyzer() {
}

StaticAnalyzer.analyze = function (program, eventManager) {
  const rules = program.getRules();
  if (rules.length === 0) {
    eventManager.notify(WARNING_EVENT, {
      type: 'rule.empty',
      message: stringLiterals(
        'engine.analyzer.noRules'
      )
    });
  }
};

module.exports = StaticAnalyzer;
