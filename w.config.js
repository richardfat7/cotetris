let path = require('path');
let webpack = require('webpack');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let MiniCssExtractPlugin = require('mini-css-extract-plugin');
let precss = require('precss');
let autoprefixer = require('autoprefixer');
let CopyWebpackPlugin = require('copy-webpack-plugin');
let version = require('./package.json').version;


// 程序入口
let entry =  {
    'app': __dirname + '/src/index.js',
};

// 输出文件
let output =  {
    filename: 'page/[name]/index.js',
    chunkFilename: 'chunk/[name].[chunkhash:5].chunk.js',
};

// 生成source-map追踪js错误
let devtool = 'source-map';

// eslint
// let eslint =  {
//     configFile: __dirname + '/.eslintrc.js',
// };

// loader
let rules = [
    {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        // loader: 'babel!eslint-loader',
        loader: 'babel-loader',
    },
    {
        test: /\.(?:png|jpg|gif)$/,
        loader: 'url-loader',
        options: {
            limit: 8192,
        },
    },
    {
        test: /\.less$/,
        use: [
            // {
            //     loader: MiniCssExtractPlugin.loader,
            //     options: {
            //         publicPath: './server',
            //     },
            // },
            {
                loader: 'style-loader',
            },
            {
                loader: 'css-loader',
                options: {
                    modules: true,
                    sourceMap: true,
                },
            },
            // {
            //     loader: 'postcss-loader',
            //     options: {
            //         sourceMap: true,
            //         plugins: [
            //             precss,
            //             autoprefixer,
            //         ],
            //     },
            // },
            {
                loader: 'less-loader',
                options: {
                    sourceMap: true,
                },
            },
        ],
        // use: 'css?modules&localIdentName=[hash:base64:4]!postcss!less',
    },
];

// dev plugin
let devPlugins =  [
    new CopyWebpackPlugin([
        { from: './src/resource/music/music.mp3' },
        { from: './src/resource/css/loader.css' },
    ]),
    new webpack.LoaderOptionsPlugin({
        debug: true,
    }),
    // 热更新
    // new webpack.HotModuleReplacementPlugin(),
    // 允许错误不打断程序, 仅开发模式需要
    // new webpack.NoErrorsPlugin(),
    // 打开浏览器页面
    // new OpenBrowserPlugin({
    //     url: 'http://127.0.0.1:8080/',
    // }),
    // css打包
    new MiniCssExtractPlugin({
        filename: '[name].css',
    }),
];

// production plugin
let productionPlugins = [
    // 定义生产环境
    new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"',
    }),
    // 复制
    new CopyWebpackPlugin([
        { from: './src/resource/music/music.mp3' },
        { from: './src/resource/css/loader.css' },
    ]),
    // HTML 模板
    new HtmlWebpackPlugin({
        template: __dirname + '/server/index.tmpl.html',
    }),
    // JS压缩
    // new webpack.optimize.UglifyJsPlugin({
    //     compress: {
    //         warnings: false,
    //     } }
    // ),
    // css打包
    new MiniCssExtractPlugin({
        filename: 'css-' + version + '.css',
    }),
];

// dev server
let devServer = {
    // contentBase: path.join(__dirname, './server'),
    // publicPath: path.join(__dirname, './server'),
    contentBase: path.join(__dirname, 'server'),
    publicPath: path.join(__dirname, 'server'),
    filename: '[name].js',
    // colors: true,
    // historyApiFallback: true,
    port: 8080, // defaults to "8080"
    // hot: true, // Hot Module Replacement
    // inline: true, // Livereload
    host: '0.0.0.0',
    // disableHostCheck: true,
};

module.exports = {
    entry: entry,
    devtool: devtool,
    output: output,
    rules: rules,
    devPlugins: devPlugins,
    productionPlugins: productionPlugins,
    devServer: devServer,
    // postcss: function () {
    //     return [precss, autoprefixer];
    // },
    version: version,
};
