import Peer from 'peerjs';


const ConnectionService = () =>{

  let peer;
  const connectedPeers = {};

  function setup(address, connectedPeersCallback) {
    return new Promise((resolve, reject) => {
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
        reject(err);
      });
      peer.on('open', (id) => {
        console.log('open', {id});
        resolve(id);
      });

      // Await connections from others
      peer.on('connection', (c) => {
        console.log('connection', c);
        configureConnection(c, connectedPeersCallback);
      });
    });
  }
  function configureConnection(connection, callbacks) {
    if(!connectedPeers[connection.peer]) {
      connection.on('error', (err) => {
        console.log(err);
        alert(err);
      });
      connection.on('open', () => {
        console.log("connected to: ", connection.peer);
        connectedPeers[connection.peer] = connection;
        connection.on('data', (value) => {
          console.log('data', JSON.stringify({value}));
          if(callbacks.afterData) {
            callbacks.afterData(connection.peer, value);
          }
        });
        if(callbacks.afterOpen) {
          callbacks.afterOpen(connection.peer);
        }
      });
    }
  }

  function connect(peerId) {
    // Handle a chat connection.
    return new Promise((resolve, reject) => {
      if (!connectedPeers[peerId]) {
        console.log("connecting to peer: ", peerId);
        var c = peer.connect(peerId, {
          label: 'chat',
          serialization: 'none',
          metadata: {message: 'join game request'}
        });
        configureConnection(c, resolve);
      } else {
        console.log("already connected!", peerId);
      }
    });
  }

  function send(peerId, obj) {
    const c = connectedPeers[peerId];
    if (c) {
      console.log({c});
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
