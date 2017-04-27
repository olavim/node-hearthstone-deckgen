import webpack from 'webpack';
import _debug from 'debug';
import express from 'express';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

const debug = _debug('hs-decker:server');

(async() => {
	const webpackConfig = require('../build/webpack.config');
	const config = require('../config');
	const paths = config.utils_paths;
	const app = express();

	if (config.env === 'development') {
		debug('Server is running in development environment');

		if (config.hot) {
			const compiler = webpack(webpackConfig);
			const {publicPath} = webpackConfig.output;

			app.use(webpackDevMiddleware(compiler, {
				publicPath,
				contentBase: paths.src(),
				hot: true,
				quiet: config.compiler_quiet,
				noInfo: config.compiler_quiet,
				lazy: false,
				stats: config.compiler_stats
			}));
			app.use(webpackHotMiddleware(compiler));

			app.use(express.static(paths.src('static')));
		} else {
			app.use(express.static(paths.dist()));
		}
	} else {
		debug('Server is running in production environment');

		app.use(express.static(paths.dist()));
	}

	const port = config.server_port;
	const host = config.server_host;

	app.listen(port);
	debug(`Server is now running at http://${host}:${port}.`);
	debug(`Server accessible via localhost:${port} if you are using the project defaults.`);
})();