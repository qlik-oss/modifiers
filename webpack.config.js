const path = require('path');

const srcDir = path.resolve(__dirname, './src');
const nodeDir = path.resolve(__dirname, './node_modules');
const distDir = path.resolve(__dirname, './dist');

const createConfig = function createConfig(isDebug) {
  const config = {
    mode: isDebug ? 'development' : 'production',
    context: path.resolve(__dirname, './src'),
    entry: {
      'qlik-modifiers': './index',
    },
    output: {
      path: distDir,
      filename: '[name].js',
      library: 'qlikmodifiers',
      libraryTarget: 'umd',
      publicPath: '/qlik-modifiers/',
    },
    module: {
      rules: [{
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
        },
        include: [srcDir],
        exclude: [nodeDir],
      }],
    },
    plugins: [],
  };

  if (isDebug) {
    config.devtool = 'source-map';
  }

  return config;
};

module.exports = [
  createConfig(true),
  createConfig(true),
];
