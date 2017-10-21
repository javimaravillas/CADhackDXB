import React, {Component } from 'react';
import getWeb3 from './utils/getWeb3';
import connectionService from './services/connectionService';
import { connect } from 'react-redux';
import RaisedButton from 'material-ui/RaisedButton';
import { List, ListItem } from 'material-ui/List';
import Avatar from 'material-ui/Avatar';

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class GameApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      peerId: '',
      peers: {},
      master: '',
      connectTo: '',
      connected: false
    };
  }

  componentWillMount() {
    getWeb3.then(results => {
      this.setState({
        web3: results.web3,
        master: "0xc70f6e964540f7e031f428d7ba891307f6cf6e05"
      });
      results.web3.eth.getAccounts((error, accounts) => {
        if(error) {
          console.log(error);
        } else {
          connectionService.setup(
            accounts[0], {
              afterOpen: (addr) => this.props.updateConnectedPeers(addr),
              afterData: (addr, data) => this.handleData(addr, data)
            })
          .then((id) => {
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

  getPlayerAddresses() {
    return [
      "0x711b926dad3bf4a5aec55f3283275e2ae3931298",
      "0xc70f6e964540f7e031f428d7ba891307f6cf6e05"];
  }

  connect() {
    const playerAddresses = this.getPlayerAddresses()
    playerAddresses.forEach((address) => {
      if(address !== this.state.peerId) {
        const callbacks = {
          afterOpen: (addr) => this.props.updateConnectedPeers(addr),
          afterData: (addr, data) => this.handleData(addr, data)
        }
        connectionService.connect(address, callbacks)
        .then(() => {
          console.log(this.state.connectedPeers)
        })
      }
    });
  }

  endRound(winner) {
    alert(winner)
  }

  handleData(address, data) {
    if (data.card) {
      return this.acceptCard(address, data)
    }
    if (data.winner) {
      this.endRound(data.winner)
    }
  }

  checkEndGame() {
    if (this.roundIsOver()) {
      const winner = this.calculateWinner()
      // refactor to remove self !!!
      this.props.connections.map(address =>
        connectionService.send(address, {winner: winner}))
      this.endRound(winner)
    } else {
      console.log(this.state.peers)
    }
  }

  isMaster() {
    return this.state.master === this.state.peerId
  }

  drawCard() {
      return parseInt(Math.random() * 52, 10) + 1
  }

  getCardURL(cardNumber) {
      let cards = {10: "J", 11: "Q", 12: "K", 13: "A"}
      let suites = {1: "C", 2: "H", 3: "D", 4: "S"}
      let card = (cardNumber % 13) + 1
      card = card > 9 ? cards[card] : (card + 1) + ""
      let suite = suites[(cardNumber % 4) + 1]

      return "https://deckofcardsapi.com/static/img/" + card + suite + ".png"
  }

  dealCard() {
    let card = this.drawCard()
    if(this.isMaster()) {
      let peers = this.state.peers
      peers[this.state.peerId] = card
      this.setState({
        peers: peers,
        cardUrl: this.getCardURL(card)
      })

      this.checkEndGame()
    } else {
      connectionService.send(this.state.master, { card: card })
      this.setState({
          cardUrl: this.getCardURL(card)
      })
    }
  }

  roundIsOver() {
    const playerAddresses = this.getPlayerAddresses()
    return playerAddresses.map(address =>
      this.state.peers[address] !== undefined
    ).every(b => b)
  }

  calculateWinner() {
    let max = 0
    let winner
    for (let i in this.props.connections) {
      let address = this.props.connections[i]
      if (this.state.peers[address] > max) {
        max = this.state.peers[address]
        winner = address
      }
    }
    return winner
  }

  acceptCard(address, data) {
    if (!this.isMaster()) {
      throw new Error("Only the master can accept cards!")
    }
    let peers = this.state.peers
    peers[address] = data.card
    this.setState({
      peers: peers
    })
    this.checkEndGame()
  }

  render() {
    const connections = this.props.connections.map((connection, index) => {
      return (<ListItem rightAvatar={<Avatar src={require(`./images/avatar${index+1}.jpg`)}/>} primaryText={connection} key={index}/>);
    });
    
    return (
      <div id="actions">
        <h1 className="header"> P2P Protocol for off-chain communication during real-time game play </h1>
        <div>Status: {this.state.connected ? "Connected" : "Not Connected" } </div>
        Your PeerJS ID is <span id="pid">{this.state.peerId}</span>
        <br/>
        <RaisedButton label="Join Game" className="connect" id="connect" onClick={(e) => this.connect()} />
        { connections.length ? 
        <div>
          <List className="gameList">
            { connections }
          </List>
          <RaisedButton label="Deal a Card" onClick={() => this.dealCard()} className="get-card" />
            </div>
          : "" 
        }
        <img src={ this.state.cardUrl }></img>
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
