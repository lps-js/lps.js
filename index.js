const LPS = require('./src/LPS');

if (process.browser) {
  window.LPS = LPS;
}

module.exports = LPS;
