import React, {Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import GameLogicComponent from './GameLogicComponent';

class JoinForm extends Component {

    constructor(props) {
	super(props);
	this.state = {
	    hasJoined: false,
	    gameStarted: false,
	    accounts: []
	};
    }
    
    startWatching() {
	const {contractInstance, address } = this.props;
	const gameStartEvents = contractInstance.GameStarting({fromBlock: "latest"});
	const startEvents = gameStartEvents.watch((error, result) => {
	// This will catch all Transfer events, regardless of how they originated.
	if (error == null) {
	    console.log("GOT START EVENTS", result.args);
	    const {playerAccount, nextPeer, prevPeer} = result.args;
	    if (playerAccount === address) {
		console.log({accounts: this.state.accounts});
		this.setState({
		    accounts: [playerAccount, nextPeer, prevPeer],
		    gameStarted: true			      
		});
	    }
	}
	});

    }

    join() {
	const {contractInstance, address, web3 } = this.props;
	console.log("Joining....");
	this.startWatching();
	contractInstance.joinGame({from:address, gas: 1000000, value: web3.toWei(10, 'ether') } ).then(() => {
	    console.log("Player joined!");
	    this.setState({hasJoined: true});	    
	});
    };

    
    render() {
	const {contractInstance, address, name, web3} = this.props;

	let gameStarted = false;
	let accounts = [];
	
	if (!contractInstance) {
	    return (<div> loading... </div>);
	}
	const props = this.props;
	
	const GameView = this.state.gameStarted ?
		  (
		      <div>
			<GameLogicComponent {...props} playerAccounts={this.state.accounts}/>
		      </div>
		  ) : (	
			  <div>
			  Waiting for other players...
		      </div>
		  );
	
	const joinButton = (
	    <div>
	  <h2> You're not currently in any games </h2>
          <RaisedButton label="Join Game" className="connect" id="connect"  onClick={() => this.join()} />
	</div>
	);

    return (
	<div>
	  <h3> Welcome back, {name}!</h3>
	  <br/>
	  {this.state.hasJoined ? GameView: joinButton }
	</div>
    );
    }
}

export default JoinForm;
