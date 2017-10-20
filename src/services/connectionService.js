import Peer from 'peerjs';

const ConnectionService = () =>{

    let peer;
    const connectedPeers = {};
    
    function setup(address) {
        peer = new Peer(address, {
            host: '10.0.212.83',
            port: 9000,
            debug: 3,
            logFunction: function() {
                var copy = Array.prototype.slice.call(arguments).join(' ');
		console.log(copy);
                //$('.log').append(copy + '<br>');		
            }
        });
        peer.on('error', function(err) {
            console.log(err);
        });
        peer.on('open', (id) => {
	    console.log({id});
        });
        // Await connections from others
        peer.on('connection', (c) => this.connect(c));

	
	
    }

  function connect(peerId) {
    // Handle a chat connection.

    if (!connectedPeers[peerId]) {
      var c = peer.connect(peerId, {
        label: 'chat',
        serialization: 'none',
        metadata: {message: 'join game request'}
      });
      c.on('error', (err) => {
          console.log(err);
          alert(err);
      });
      c.on('open', (value) => {
        connectedPeers[peerId] = 1;
          console.log("connected to: ", peerId);
      });
	c.on('data', (value) => {
	    console.log({value});
	});
	
    } else {
	alert("already connected!", peerId);
    }
  }

    function send(peerId, obj) {
	const c = connectedPeers[peerId];
	if (c) {
	    c.send(obj);	    
	} else {
	    alert("You are not connect to: ", peerId);
	}
    }

    
    return {
	setup, 
	connect,
	send
    };
}


export default ConnectionService();
