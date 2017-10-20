import React, { Component } from 'react'
import Peer from 'peerjs'
import $ from 'jquery'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

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
    }
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
            peer = new Peer(accounts[0], {
              host: '10.0.212.83',
              port: 9000,
              debug: 3,
              logFunction: function() {
                var copy = Array.prototype.slice.call(arguments).join(' ');
                $('.log').append(copy + '<br>');
              }
            });
            peer.on('error', function(err) {
              console.log(err);
            });
            peer.on('open', (id) => {
              this.setState({
                'peerId': id
              });
            });
            // Await connections from others
            peer.on('connection', (c) => this.connect(c));
          }
      });
    }).catch(() => {
      console.log('Error finding web3.')
    });
  }

  instantiateContract() {

  }

  seeIfGameFinished() {
    const numbers = this.state.get('numbers')
    if(Object.keys(numbers).length === 3) {
      var highestNum = 0;
      var winner = 0;
      Object.keys(this.state.get('numbers')).forEach(function(peerId) {
        if(numbers[peerId] > highestNum) {
            highestNum = numbers[peerId];
            winner = peerId;
        }
      })
      alert(`Game finished. ${winner} wins with number ${highestNum}`);
    }
  }

  connect() {
    // Handle a chat connection.
    var connectedPeers = this.state.connectedPeers
    if (!connectedPeers[this.state.connectTo]) {
      var c = peer.connect(this.state.connectTo, {
        label: 'chat',
        serialization: 'none',
        metadata: {message: 'join game request'}
      });
      c.on('error', function(err) { alert(err); });
      connectedPeers[this.state.connectTo] = 1;
      this.setState({
        connectedPeers: connectedPeers
      })
    } else {
      alert("already connected!")
    }
  }

  handlePeerInput(e) {
    this.setState({ connectTo: e.target.value })
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
          onChange={(e) => this.handlePeerInput(e)}
          placeholder="Someone else's id"></input>
      <button className="connect" id="connect" onClick={() => this.connect()}>Connect</button>
      <button className="get-card">Deal a card</button>
      <div id="connections">
        <span className="filler">You have not yet made any connections.</span>
        {connections.length ? <ul>{connections}</ul> : "No connections"}
      </div>
      </div>
    );
  }
}

export default App
