import React from 'react';
import ReactDOM from 'react-dom';
import App from './containers/App';
require('./styles/style.scss');

const MOUNT_NODE = document.getElementById('content');

if (__DEV__ && module.hot) {
	module.hot.accept();
}

ReactDOM.render(
	<App />,
	MOUNT_NODE
);