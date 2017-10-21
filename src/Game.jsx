import React, {Component } from 'react';
import getWeb3 from './utils/getWeb3';
import CardTableContract from '../build/contracts/CardTable.json';
import RegisterForm from './RegisterForm';
import JoinForm from './JoiningForm';




import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class GameApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
	peerId: '',
	master: '',
	connectTo: '',
	connected: false,
	address: "",
	web3: null,
	cardTableInstance: null,
	isRegistered: 0,  // have not checked yet
	playerName: "",
    };
  }

    
    componentWillMount() {
	const accountIndex = this.getParamFromUrl();		  
	getWeb3.then(results => {
	    this.setState({
		web3: results.web3
	    });
	    results.web3.eth.getAccounts((error, accounts) => {
		if(error) {
		    console.log(error);
		} else {
		    this.instantiateContract();
		    this.setState({
			address: accounts[accountIndex],
			master: accounts[1]
		    });
		}
	    });
    }).catch(() => {
      console.log('Error finding web3.');
    });
  }

    instantiateContract() {
	const contract = require('truffle-contract');
	const cardTable = contract(CardTableContract);
	cardTable.setProvider(this.state.web3.currentProvider);

	// Declaring this for later so we can chain functions on SimpleStorage.
	var cardTableInstance;

	// Get accounts.
	this.state.web3.eth.getAccounts((error, accounts) => {
	    cardTable.deployed().then((instance) => {
		this.setState({cardTableInstance: instance});
		return instance
	    }).then((instance) => {
		instance.getPlayerId.call(this.state.address).then((result) => {
		    if (result[0]) {
			instance.players(result[1]).then((result) => {
			    this.setState({
				isRegistered: 1,
				playerName: result[1]
			    });
			});
		    }
		});
	    });
	});
    }

    getParamFromUrl() {
	var url_string = window.location.href;
	var url = new URL(url_string);
	var c = url.searchParams.get("account");
	return c || 0;
    }
    

  render() {      
    const isRegistered = (this.state.isRegistered === 1) ? true : false;      
      
    return (
	<div id="actions">
        <h1 className="header"> P2P Protocol for off-chain communication during real-time game play </h1>
	Your address: {this.state.address} <br/>	
	    <br/>
	    <br/>
	    { isRegistered ?  
		<JoinForm address={this.state.address} name={this.state.playerName} contractInstance={this.state.cardTableInstance} web3={this.state.web3} master={this.state.master}/> :
	      (<RegisterForm address={this.state.address} contractInstance={this.state.cardTableInstance} web3={this.state.web3}/>) 
	    }
    </div>

    );
  }
}



export default GameApp;
