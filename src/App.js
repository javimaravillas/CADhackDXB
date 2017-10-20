import React, { Component } from 'react'



import $ from 'jquery'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'
import connectionService from './services/connectionService';

var peer;

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      peerId: '',
      connectTo: '',
      round: 1,
      numPlayers: 3,
      numbers: {},
      connectedPeers: {}
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
	      connectionService.setup(accounts[0]);
	      this.setState({
                  'peerId': accounts[0]
              });

          }
      });
    }).catch(() => {
      console.log('Error finding web3.')
    });
  }

  // instantiateContract() {

  // }

  // seeIfGameFinished() {
  //   const numbers = this.state.get('numbers')
  //   if(Object.keys(numbers).length === 3) {
  //     var highestNum = 0;
  //     var winner = 0;
  //     Object.keys(this.state.get('numbers')).forEach(function(peerId) {
  //       if(numbers[peerId] > highestNum) {
  //           highestNum = numbers[peerId];
  //           winner = peerId;
  //       }
  //     });
  //     alert(`Game finished. ${winner} wins with number ${highestNum}`);
  //   }
  // }

    connect(peerId) {
	connectionService.connect(peerId);
    }
    

  render() {
    let connections = []
    for (let name in this.state.connectedPeers) {
      connections.push(<li key="{name}">{name}</li>)
    }
    return (
      <div id="actions">
        Your PeerJS ID is <span id="pid">{this.state.peerId}</span>
        <br/>
        Connect to a peer: <input type="text" id="rid"
          placeholder="Someone else's id"></input>
        <button className="connect" id="connect" onClick={(e) => this.connect(e.target.value)}>Connect</button>
        {connections.length ? <button className="get-card">Deal a card</button>: ""}
        <div id="gameInfo">
          <div> Round: { this.state.round } </div>
        </div>
        <div id="connections">
          {connections.length ? <ul>{connections}</ul> : "You have not made any connections"}
        </div>
      </div>
    );
  }
}

export default App
