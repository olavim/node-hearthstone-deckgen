const path = require('path');
const webpack = require('webpack');
const cssnano = require('cssnano');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('../config');
const _debug = require('debug');

const debug = _debug('admin-panel-ui:webpack:config');
const paths = config.utils_paths;
const {__DEV__, __PROD__} = config.globals;

debug('Create configuration.');
const webpackConfig = {
	name: 'client',
	target: 'web',
	devtool: config.compiler_devtool,
	resolve: {
		root: __PROD__ ? paths.dist() : paths.src(),
		extensions: ['', '.js', '.jsx', '.json'],
		alias: {
			react: path.resolve('./node_modules/react'),
		}
	},
	module: {}
};

webpackConfig.entry = [
	'babel-polyfill',
	paths.src('index.js')
];

if (__DEV__ && config.hot) {
	// add HMR entry
	webpackConfig.entry.push(`webpack-hot-middleware/client?path=${config.compiler_public_path}__webpack_hmr`);
}

webpackConfig.output = {
	filename: `[name].[${config.compiler_hash_type}].js`,
	path: paths.dist(),
	publicPath: config.compiler_public_path
};

webpackConfig.plugins = [
	new webpack.DefinePlugin(config.globals),
	new HtmlWebpackPlugin({
		template: paths.src('index.html'),
		hash: false,
		favicon: paths.src('static/favicon.ico'),
		filename: 'index.html',
		inject: 'body',
		minify: {collapseWhitespace: true}
	})
];

if (__DEV__ && config.hot) {
	debug('Enable plugins for live development (HMR, NoErrors).');
	webpackConfig.plugins.push(
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoErrorsPlugin()
	)
} else if (__PROD__) {
	debug('Enable plugins for production (OccurenceOrder, Dedupe & UglifyJS).');
	webpackConfig.plugins.push(
		new webpack.optimize.OccurrenceOrderPlugin(),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				unused: true,
				dead_code: true,
				warnings: false
			}
		})
	)
}

webpackConfig.module.loaders = [
	{
		test: /\.jsx?$/,
		exclude: /node_modules/,
		loader: 'babel',
		query: {
			cacheDirectory: true,
			plugins: ['transform-runtime'],
			presets: ['es2015-node6/object-rest', 'es2015', 'es2016', 'es2017', 'stage-1', 'react'],
			env: {production: {presets: ['react-optimize']}}
		}
	},
	{test: /\.json$/, loader: 'json-loader'}
];

const BASE_CSS_LOADER = 'css?modules&sourceMap&-minimize';

webpackConfig.module.loaders.push({
	test: /\.scss$/,
	loaders: [
		'style',
		BASE_CSS_LOADER,
		'postcss',
		'sass?sourceMap'
	]
});

webpackConfig.module.loaders.push({
	test: /\.css$/,
	loaders: [
		'style',
		BASE_CSS_LOADER,
		'postcss'
	]
});

webpackConfig.sassLoader = {
	includePaths: paths.src('styles')
};

webpackConfig.postcss = [
	cssnano({
		autoprefixer: {
			add: true,
			remove: true,
			browsers: ['last 2 versions']
		},
		discardComments: {removeAll: true},
		discardUnused: false,
		mergeIdents: false,
		reduceIdents: false,
		safe: true,
		sourcemap: true
	})
];

webpackConfig.module.loaders.push(
	{test: /\.svg(\?.*)?$/, loader: 'url?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=image/svg+xml'},
	{test: /\.(png|jpg)$/, loader: 'url?limit=8192'}
);

module.exports = webpackConfig;
