import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import reducers from './reducers';

import GameApp from './Game';

const store = createStore(reducers);


class App extends Component {
    render() {

	return (
    <MuiThemeProvider>
	    <Provider store={store}>
	      <GameApp />
		  </Provider>
    </MuiThemeProvider>
	);
    }
}

export default App
