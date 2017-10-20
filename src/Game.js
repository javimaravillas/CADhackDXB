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
	      connectionService.setup(accounts[0]).then((id) => {
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
	//connectionService.connect(this.state.connectTo);
	this.props.connect(this.state.connectTo);
    }
    
    
    render() {
	const connections = this.props.connections.map((connection, index) => {
	    return (<li key={index}>{connection}</li>);
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
        {connections.length ? <button className="get-card">Deal a card</button>: ""}
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
	connect: (payload) => dispatch({type: "GOT_NEW_CONNECTION", payload})
    };
}


export default connect(mapStateToProps, mapDispatchToProps)(GameApp);
