const LPS = require('./src/LPS');
const meta = require('./package.json');
LPS.meta = meta;

if (process.browser) {
  window.LPS = LPS;
}

module.exports = LPS;
