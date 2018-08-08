const path = require('path');

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lps.bundle.js'
  },
  module: {
    rules: [
      { test: /\.lps/, use: 'raw-loader' }
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty'
  }
};
