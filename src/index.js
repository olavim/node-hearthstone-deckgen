import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import {lightBlue500} from 'material-ui/styles/colors'
import App from './containers/App';
require('./styles/style.scss');

const MOUNT_NODE = document.getElementById('content');

if (__DEV__ && module.hot) {
	module.hot.accept();
}

try {
	injectTapEventPlugin();
} catch (err) {
	if (!module.hot) {
		throw err;
	}
}

const muiTheme = getMuiTheme({
	tabs: {
		backgroundColor: lightBlue500
	},
	dropDownMenu: {
		accentColor: '#aaa'
	}
});

ReactDOM.render(
	<MuiThemeProvider muiTheme={muiTheme}>
		<App />
	</MuiThemeProvider>,
	MOUNT_NODE
);
