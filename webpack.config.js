const path = require('path');
const webpack = require('webpack');

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
  plugins: [
    new webpack.IgnorePlugin(/(modules\/(p2p|fs))/)
  ],
  node: {
    fs: 'empty',
    net: 'empty'
  }
};
