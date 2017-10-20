


const GameService = () => {

    const currentRoundId;
    
    function joinGame(name) {	
	// 1. send deposit to smart-contract with name

	// subscribe for smart-contrct game event
	function _gameStartedCallback() {
	    // 2. get peerIds from the smart-contract
	    
	    // 3. establish the connection with each peerId and subscribe for events

	    function _getPeerRandomNumberCallback() {
		
		// save result
		// if all peers have provided a number:
		//  calculate result and define the winner
		//  
	    }	   
	}		
    }


    function runRound() {	
	// generate a large random number
	
	// Hash the number (and a nonce (block hash that started the game))
	
	// push round number hashed random number with other players 
    }

    

    function claimPayout() {
	// claim payout from the smart contract	
    }

    
}


export default new GameService();
