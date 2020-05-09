const path = require('path');
const config = require('./w.config');

// dev环境配置
module.exports = {
    devtool: config.devtool,
    entry: config.entry,
    output: {
        path: path.join(__dirname, 'server'),
        publicPath: path.join(__dirname, 'server'),
        filename: '[name].js',
    },
    // eslint: config.eslint,
    module: {
        rules: config.rules,
    },
    plugins: config.devPlugins,
    devServer: config.devServer,
    optimization: {
        minimize: false, // true for prod
    },
    // postcss: config.postcss,
};
