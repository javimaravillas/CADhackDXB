import React, {Component } from 'react';
import getWeb3 from './utils/getWeb3';
import connectionService from './services/connectionService';
import { connect } from 'react-redux';

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'


class GameApp extends Component {
  constructor(props) {
      super(props);
      this.state = {
	  peerId: '',
	  connectTo: '',
	  connected: false
    };
  }

  componentWillMount() {
    getWeb3.then(results => {
      this.setState({
        web3: results.web3
      });
      results.web3.eth.getAccounts((error, accounts) => {
          if(error) {
            console.log(error);
          } else {	      
	      connectionService.setup(accounts[0], this.props.updateConnectedPeers).then((id) => {
		  this.setState({
            'peerId': id,
		      connected: true		      
		  });
	      });
          }
      });
    }).catch(() => {
	console.log('Error finding web3.');
    });
  }

    connect() {
        const playerAddresses = ["0xa3fce31fc0f89bdf7e52284d389ead28dfce81be", "0x711b926dad3bf4a5aec55f3283275e2ae3931298", "0x7D4917388E9a304B01a6A1C2E62b601684C7a825"];
        playerAddresses.forEach((address)=> {
            if(address !== this.state.peerId) {
                connectionService.connect(address).then(() => {
                    this.props.updateConnectedPeers(address);
                });
            }
        });

    }
    
    sendMessage() {
	this.props.connections.map((connection, index) => {
	    connectionService.send(connection,  { card: Math.random });
	})
    }

    
    render() {
	const connections = this.props.connections.map((connection, index) => {
	    return (<li key={index}>
		      {connection}
		    </li>);
	});
    return (
	    <div id="actions">
	    {this.state.connected ? (<div>Connected </div>) : (<div>Not Connected </div>)   } <br/>
        Your PeerJS ID is <span id="pid">{this.state.peerId}</span>
        <br/>
            Connect to a peer: <input type="text" id="rid"
	onChange={(e) => this.setState({connectTo: e.target.value}) }
          placeholder="Someone else's id"></input>
            <button className="connect" id="connect" onClick={(e) => this.connect()}>Connect</button>
	    { connections }
        { connections.length ? <button onClick={() => this.sendMessage()} className="get-card">Deal a card</button>: ""}
      </div>
    );
  }
}

const mapStateToProps = (store) => {
    console.log({store});
    return {
	connections: store.connections
    };
}

const mapDispatchToProps = (dispatch) => {
    return {
        updateConnectedPeers: (payload) => dispatch({type: "GOT_NEW_CONNECTION", payload})
    };
}


export default connect(mapStateToProps, mapDispatchToProps)(GameApp);
