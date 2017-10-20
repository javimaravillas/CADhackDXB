import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';


import reducers from './reducers';

import GameApp from './Game';

const store = createStore(reducers);


class App extends Component {
    render() {

	return (
	    <Provider store={store}>
	      <GameApp />
		</Provider>
	);
    }
}

export default App
