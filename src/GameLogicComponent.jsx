import React, {Component } from 'react';
import connectionService from './services/connectionService';
import { connect } from 'react-redux';
import Avatar from 'material-ui/Avatar';
import { List, ListItem } from 'material-ui/List';
import RaisedButton from 'material-ui/RaisedButton';


class GameLogicComponent extends Component {
  constructor(props) {
    super(props);
      this.state = {
	peers: {},
	gameOver: false,
	connected: false,
	  winningCardURL: '',
	  peerId: ''
    };
  }

    componentWillMount() {
	connectionService.setup(
	    this.props.address, {
		afterOpen: (addr) => this.props.updateConnectedPeers(addr),
		afterData: (addr, data) => this.handleData(addr, data)
	    })
	    .then((id) => {
		this.connect();		
		this.setState({
		    'peerId': id,
		    connected: true,
		    master: this.props.master
		});
	    });
    }
    

    
  connect() {
      const playerAddresses = this.props.playerAccounts;
      playerAddresses.forEach((address) => {
	  if(address !== this.props.address) {
              const callbacks = {
		  afterOpen: (addr) => this.props.updateConnectedPeers(addr),
		  afterData: (addr, data) => this.handleData(addr, data)
        };
              connectionService.connect(address, callbacks)
		  .then(() => {
		      console.log("connected to peers!");
		      //console.log(this.state.connectedPeers)
		  });
	  }
   });
  }

  endRound(winner) {
      const msg = winner === this.props.address ? "You win!" : "You lose!";
      alert(msg);
  }

  handleData(address, data) {
    if (data.card) {
      return this.acceptCard(address, data)
    }
    if (data.winner) {
      this.endRound(data.winner)
      this.setState({
        winningCardURL: this.getCardURL(data.winningCard)
      })
    }
  }

  reveal() {
    if (!this.isMaster()) {
      throw new Error("Only the master can reveal the winner!")
    }
    if (this.roundIsOver()) {
      const winner = this.calculateWinner()
      // refactor to remove self !!!
      this.props.connections.filter((address) => address !== this.props.address).map(address =>
        connectionService.send(address, {
          winner: winner,
          winningCard: this.state.peers[winner]
        }))
      this.endRound(winner)
    } else {
      console.error("the round is not over!")
    }
  }

  checkEndGame() {
    if (this.roundIsOver()) {
      //const winner = this.calculateWinner()
      // refactor to remove self !!!
  	// this.props.connections.filter((address) => address !== this.props.address).map(address => {
  	//     connectionService.send(address, {
  	// 	winner: winner,
  	// 	winningCard: this.state.peers[winner]
        //     });
  	// });
      this.setState({
        gameOver: true
      })
    }

    //   else {
    //   console.log(this.state.peers)
    // }
  }

  isMaster() {
    return this.state.master === this.props.address
  }

  drawCard() {
      return parseInt(Math.random() * 52, 10) + 1
  }

  getCardURL(cardNumber) {
      let cards = {9: "0", 10: "J", 11: "Q", 12: "K", 13: "A"}
      let suites = {1: "C", 2: "H", 3: "D", 4: "S"}
      let card = parseInt((cardNumber - 1) / 4) + 1
      card = card > 8 ? cards[card] : (card + 1) + ""
      let suite = suites[(cardNumber % 4) + 1]

      return "https://deckofcardsapi.com/static/img/" + card + suite + ".png"
  }
    
    dealCard() {
	let card = this.drawCard();
	if(this.isMaster()) {
	    let peers = this.state.peers
	    peers[this.props.address] = card
	    this.setState({
		peers: peers,
	    })
	    this.checkEndGame()
	} else {
	    connectionService.send(this.props.master, { card: card })
	}
	this.setState({
            cardUrl: this.getCardURL(card)
	})
  }

  roundIsOver() {
      const playerAddresses = this.props.playerAccounts;
      return playerAddresses.map(address =>
				 this.state.peers[address] !== undefined
				).every(b => b);
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
      let peers = this.state.peers;
      peers[address] = data.card;
    this.setState({
      peers: peers
    });
    if (!this.isMaster()) {
	throw new Error("Only the master can end game!");
    } else {
	this.checkEndGame();	
    }
  }

    render() {
	const connections = this.props.connections.map((connection, index) => {
    	  return (<ListItem rightAvatar={this.state.peers[connection] ? <Avatar className="card-avatar" src={this.getCardURL(this.state.peers[connection])}/> : undefined} leftAvatar={<Avatar src={require(`./images/avatar${index+2}.jpg`)}/>} primaryText={connection} key={index}/>);
    });

	const connectionComponent = (
        <div>
          <List className="gameList">
            <ListItem rightAvatar={this.state.cardUrl ? <Avatar className="card-avatar" src={this.state.cardUrl}/> : undefined} leftAvatar={<Avatar src={require(`./images/avatar1.jpg`)}/>} primaryText={this.props.address + " (You)"} />
            { connections }
          </List>
          <RaisedButton label="Deal a Card" onClick={() => this.dealCard()} className="get-card" />
        </div>
	);

	return (
	    <div>
	      <div>Status: {this.state.connected ? "Connected" : "Not Connected" } </div>
	      Your PeerJS ID is <span id="pid">{this.props.address}</span>	 
	      <br/>
	      {connectionComponent}
              { this.props.address === this.props.master && this.state.gameOver ?
		  <RaisedButton label="Reveal winner" className="reveal" id="reveal" onClick={(e) => this.reveal()} />: "" }
		    <br/>
		    <br/>
		    <img className="card" src={ this.state.cardUrl }></img>
		    { this.state.winningCardURL ? <img className="card" src={ this.state.winningCardURL }></img> : "" }
	    </div>
	 );
    }    
}


const mapStateToProps = (store) => {
  //console.log({store});
  return {
    connections: store.connections
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateConnectedPeers: (payload) => dispatch({type: "GOT_NEW_CONNECTION", payload})
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(GameLogicComponent);

    
