const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    url: require.resolve('url'),
    crypto: require.resolve('crypto-browserify'),
    querystring: require.resolve('querystring-es3'),
    https: require.resolve('https-browserify'),
    http: require.resolve('stream-http'),
    fs: false, // `fs` is not needed in the browser
    buffer: require.resolve('buffer'),
    process: require.resolve('process/browser'), // Add this line
  };

  // Add a plugin to provide global variables
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser', // Add this line
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return config;
};