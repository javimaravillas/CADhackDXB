import { combineReducers } from 'redux';


const connections = (state = [], action) => {
    console.log("got event", {action});
    let nextState;
    switch (action.type) {
    case "GOT_NEW_CONNECTION":
	console.log({state});
	nextState = [
	    ...state, action.payload
	];
	break;
    default:
	nextState = state;
	break;
    }

    // Simply return the original `state` if `nextState` is null or undefined.
    return nextState;
}

    


export default combineReducers({
    connections
});

