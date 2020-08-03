const WebpackDevServer = require('webpack-dev-server');
const Webpack = require('webpack');

const { NODE_ENV } = process.env;
let webpackConfigPath;

if (NODE_ENV === 'production') {
    webpackConfigPath = '../webpack.production.config.js';
} else {
    webpackConfigPath = '../webpack.config.js';
}

const webpackConfig = require(webpackConfigPath);
const compiler = Webpack(webpackConfig);
const { host, port } = webpackConfig.devServer;

const server = new WebpackDevServer(compiler, webpackConfig.devServer);

server.listen(port, host, () => {
    console.log(`Starting server on http://${host}:${port}`);
});
