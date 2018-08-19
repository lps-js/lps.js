const path = require('path');

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lps.bundle.js'
  },
  resolveLoader: {
    modules: [
      'node_modules',
      path.resolve(__dirname, 'loaders')
    ]
  },
  module: {
    rules: [
      { test: /\.lps/, use: 'lps-min-loader' }
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty'
  }
};
