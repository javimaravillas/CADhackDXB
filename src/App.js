import React, { Component } from 'react'
import Peer from 'peerjs'
import $ from 'jquery'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'


var peer = new Peer({
  host: '127.0.0.1',
  port: 9000,
  debug: 3,
  logFunction: function() {
    var copy = Array.prototype.slice.call(arguments).join(' ');
    $('.log').append(copy + '<br>');
  }
});
peer.on('error', function(err) {
  console.log(err);
})

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      peerId: '',
      round: 1,
      numPlayers: 3,
      numbers: {},
      connectedPeers: {}
    }
  }

  componentWillMount() {
    // Show this peer's ID.
    var self = this
    peer.on('open', (id) => {
      self.setState({
        'peerId': id
      })
    });
    // Await connections from others
    peer.on('connection', (c) => this.connect(c));
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

  connect(c) {
    // Handle a chat connection.
    if (c.label === 'chat') {
      var chatbox = $('<div></div>').addClass('connection').addClass('active').attr('id', c.peer);
      var header = $('<h1></h1>').html('Chat with <strong>' + c.peer + '</strong>');
      var messages = $('<div><em>Peer connected.</em></div>').addClass('messages');
      chatbox.append(header);
      chatbox.append(messages);

      // Select connection handler.
      chatbox.on('click', function() {
        if ($(this).attr('class').indexOf('active') === -1) {
          $(this).addClass('active');
        } else {
          $(this).removeClass('active');
        }
      });
      $('.filler').hide();
      $('#connections').append(chatbox);

      c.on('data', function(data) {
        var num = parseInt(data, 10);
        var numbers = this.state.get('numbers')
        numbers[c.peer] = num;
        this.setState({
          'numbers': numbers
        })
        this.seeIfGameFinished();

      messages.append('<div><span class="peer">' + c.peer + '</span>: ' + data +
        '</div>');
      });

      c.on('close', function() {
        alert(c.peer + ' has left.');
        chatbox.remove();
        if ($('.connection').length === 0) {
          $('.filler').show();
        }
        var connectedPeers = this.state.get('connectedPeers')
        delete connectedPeers[c.peer];
        this.setState({
          'connectedPeers': connectedPeers
        })
      });
    }
    var connectedPeers = this.state.get('connectedPeers')
    connectedPeers[c.peer] = 1
    this.setState({
      'connectedPeers': connectedPeers
    })
  }

  render() {
    return (
      <div id="actions">
        Your PeerJS ID is <span id="pid">{this.state.peerId}</span>
        <br/>
        Connect to a peer: <input type="text" id="rid" placeholder="Someone else's id"></input>
      <button className="connect" id="connect">Connect</button>
        <form id="send">
          <input type="text" id="text" placeholder="Enter number"></input>
          <button type="submit" >Send</button>
        </form>
        <div id="connections">
          <span className="filler">You have not yet made any connections.</span>
        </div>
      </div>
    );
  }
}

export default App
