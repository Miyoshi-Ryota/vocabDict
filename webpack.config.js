const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',
    
    entry: {
      background: './src/background/background.js',
      content: './src/content/content.js',
      popup: './src/popup/popup.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'Shared (Extension)/Resources'),
      filename: '[name].js',
      clean: false // Don't clean the entire Resources folder!
    },
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    safari: '18'
                  }
                }]
              ]
            }
          }
        }
      ]
    },
    
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/popup/popup.html',
            to: 'popup.html'
          },
          {
            from: 'src/popup/popup.css',
            to: 'popup.css'
          },
          {
            from: 'src/data/dictionary.json',
            to: 'data/dictionary.json'
          }
        ]
      })
    ],
    
    optimization: {
      minimize: isProduction
    }
  };
};