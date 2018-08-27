const path = require('path');
const webpack = require('webpack');
const metadata = require('./package.json')

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lps-' + metadata.version + '.bundle.js'
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
    new webpack.IgnorePlugin(/engine\/modules\/(p2p|fs)/),
    new webpack.IgnorePlugin(/engine\/processors\/consult/),
    new webpack.BannerPlugin('lps.js ' + metadata.version + ' (browser). BSD-3-Clause. https://github.com/mauris/lps.js')
  ],
  node: {
    fs: 'empty',
    net: 'empty'
  }
};
