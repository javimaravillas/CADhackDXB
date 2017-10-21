import React, {Component } from 'react';


const JoinForm = ({contractInstance, address, name, web3}) => {

    let hasJoined = false;
    let gameStarted = false;
    
    const gameStartEvents = contractInstance.GameStarting({fromBlock: "latest"});
    const startEvents = gameStartEvents.watch(function(error, result) {
	// This will catch all Transfer events, regardless of how they originated.
	if (error == null) {
	    console.log("GOT START EVENTS", result.args);
	}
    });
    const join = () => {
	hasJoined = true;
	contractInstance.joinGame({from:address, gas: 1000000, value: web3.toWei(10, 'ether') } ).then(() => {
	    console.log("Player joined!");	    
	});
    };

    if (!contractInstance) {
	return (<div> loading... </div>);
    }

    const GameView = gameStarted ?
	      (
		  <div>
		    players have joined:  
		  </div>
	      ) : (	
	    <div>
	      Waiting for other players...
	 </div>
    );

    const joinButton = (
	<div>
	    <h2> You're not currently in any games </h2>
	    <button onClick={() => join()}> Join a Game </button>
	</div>
    );

    return (
	<div>
	  <h3> Welcome back, {name}!</h3>
	  <br/>
	  {hasJoined ? GameView: joinButton }
	</div>
    );
}

export default JoinForm;
