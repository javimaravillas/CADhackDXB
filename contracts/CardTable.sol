pragma solidity ^0.4.15;

contract CardTable {
  // player
  struct Player {
		address account;
		string name;
    // uint256 gamesPlayed;
    // uint256 gamesWon;
    // uint256 gamesLost;
    // uint256 gamesAborted;
	}

  mapping (address => uint256) public addressToPlayer;
  Player[] public players;

  // round of play within a game
  struct Round {
    address winner;
    bool winSubmitted;
    bool paidOut;
    bool invalidClaim;
    bool provenValid;
    bool cancelled;
    uint256[] proofs;
  }

  Round[] public rounds;

  // TODO: replace rand with cross-signed hashed proofs
  struct RoundProof {
    address account;
    uint256 random;
  }

  RoundProof[] public roundProofs;

  // game composed of players and rounds
  struct Game {
    uint256 id;
    uint256 numPlayers;
    uint256 numRounds;
    uint256 buyInAmount;
    uint256 roundPayoutAmount;
		uint256[] players;
    uint256[] rounds;
	}

  Game[] public games;

  // global state variables with defaults where available
  address public owner;
  uint256 public numPlayers = 3;
  uint256 public numRounds = 10;
  uint256 public buyInAmount = numRounds * 1 ether;

  Game public nextGame;  // game waiting to be filled with players

  // events
  event RegisteredPlayer(uint256 playerId, address playerAccount, string name);
  event WaitingForGame(address playerAccount, uint256 boughtInAmount);
  event GameStarting(uint256 gameId, address playerAccount, address nextPeer, address prevPeer);
  event WinSubmitted(uint256 gameId, uint256 roundNum, address winnerAccount, uint256 payoutAmount);
  event ClaimedInvalid(uint256 gameId, uint256 roundNum, address invalidAccount, address notifierAccount);
  // event ClaimedInvalidWin(uint256 gameId, uint256 roundNum, address invalidWinAccount, address notifierAccount);
  event InvalidProof(uint256 gameId, uint256 roundNum, address playerAccount, address proverAccount, uint256 proof);
  event SubmittedRoundResult(uint256 gameId, uint256 roundNum, address playerAccount, address notifierAccount, uint256 random);
  event ProvenValid(uint256 gameId, uint256 roundNum, address playerAccount);
  event PayWinnings(uint256 gameId, uint256 roundNum, address winnerAccount, uint256 payoutAmount);
  // event GameTimeout( uint256 gameId, address notifierAccount);
  // event PayoutTimeout(uint256 gameId, uint256 roundNum, uint256 payoutAmount);
  // event GameFinished(uint256 gameId);

  // modifiers
  modifier onlyByOwner()
	{
		require(msg.sender == owner);
		_;
	}

  modifier onlyByPlayerForRound(uint256 gameId, uint256 roundNum) {
    require(roundExists(gameId, roundNum)); // will also verify that game exists
    require(playerInGame(gameId, msg.sender));
    _;
  }

  // constructor and functions
  function CardTable() public {
		owner = msg.sender;

    // reset nextGame
    nextGame = newGame();
	}

  function updateNumPlayers(uint256 _numPlayers) public onlyByOwner() {
    require(_numPlayers > 1);
    require(buyInAmount > _numPlayers); // to ensure easy divisibility
    numPlayers = _numPlayers;
  }

  function updateNumRounds(uint256 _numRounds) public onlyByOwner() {
    require(_numRounds > 0);
    numRounds = _numRounds;
  }

  function updateBuyInAmount(uint256 _buyInAmount) public onlyByOwner() {
    require(_buyInAmount > numPlayers); // to ensure easy divisibility
    buyInAmount = _buyInAmount;
  }

  // check if this game exists
	function gameExists(uint256 gameId)
		public
		constant
		returns(bool exists)
	{
		if (games.length == 0) {
			return false;
		}

		if (games[gameId].id == gameId) {
			return true;
		}

		return false;
	}

  // check if a round exists for a given game
	function roundExists(uint256 gameId, uint256 roundNum)
		public
		constant
		returns(bool exists)
	{
    if (!gameExists(gameId)) {
      return false;
    }

    if (roundNum < games[gameId].numRounds) {
      return true;
    }

    return false;
	}

  // check if this player exists
	function playerExists(address playerAccount)
		public
		constant
		returns(bool exists)
	{
		if (players.length == 0) {
			return false;
		}

		if (players[addressToPlayer[playerAccount]].account == playerAccount) {
			return true;
		}

		return false;
	}

  // register a player
  function registerPlayer(string name) public returns(bool success) {
    // player cannot already be registered
    require(!playerExists(msg.sender));

    Player memory p = Player(msg.sender, name);

    // update index mapping and players array in one step, saving on gas
    addressToPlayer[msg.sender] = players.push(p) - 1;
		uint256 id = players.length - 1;

		RegisteredPlayer(id, msg.sender, name);

    return true;
  }

  // retrieve a player from the registry
  function getPlayerId(address playerAccount) public constant returns(bool exists, uint256 playerId) {
    if (!playerExists(playerAccount)) {
      return (false, 0);
    }

    return (true, addressToPlayer[playerAccount]);
  }

  // retrieve the number of registered players
  function playersCount() public constant returns(uint256 count) {
    return players.length;
  }

  // check if a player is in a game
  function playerInGame(uint256 gameId, address playerAccount) private constant returns(bool exists) {
    for (uint i = 0; i < games[gameId].players.length; i++) {
      if (players[games[gameId].players[i]].account == playerAccount) {
        return true;
      }
    }

    return false;
  }

  // check if a player is in the next game
  // probably could be generalized with playerInGame(), but would require
  // refactoring how nextGame is handled
  function playerInNextGame(address playerAccount) private constant returns(bool exists) {
    for (uint i = 0; i < nextGame.players.length; i++) {
      if (players[nextGame.players[i]].account == playerAccount) {
        return true;
      }
    }

    return false;
  }

  // create a new, blank game (typically nextGame)
  function newGame() private returns(Game g) {
    uint256[] memory ps;
    uint256[] memory rs;

    uint256 roundPayoutAmount = buyInAmount / numPlayers;

    // note that gameId will be initialized to 0, but must be set correctly 
    // when game is added to games array
    g = Game(0, numPlayers, numRounds, buyInAmount, roundPayoutAmount, ps, rs);

    return g;
  }

  // add a game (typically nextGame) to the games array
  function addGame(Game g) private returns(uint256 gameId) {
    // retrieve id as part of array addition to save on gas
    gameId = games.push(g) - 1;
    games[gameId].id = gameId;

    return gameId;
  }

  // called by a player who wishes to join a game
  function joinGame() public payable returns(bool success) {
    require(msg.value == buyInAmount);
    require(!playerInNextGame(msg.sender));

    // add to nextGame
    bool exists;
    uint256 playerId;
    (exists, playerId) = getPlayerId(msg.sender);
    require(exists);
    nextGame.players.push(playerId);
    WaitingForGame(msg.sender, buyInAmount);

    // if nextGame is full, start the game
    if (nextGame.players.length == nextGame.numPlayers) {

      // add game to games array
      uint256 gameId = addGame(nextGame);

      // notify the players to connect to their peers
      for (uint i = 0; i < nextGame.players.length; i++) {
        address nextPeer;
        address prevPeer;

        if (i < nextGame.players.length - 1) {
          nextPeer = players[nextGame.players[i + 1]].account;
        } else {
          nextPeer = players[nextGame.players[0]].account;
        }

        if (i > 0) {
          prevPeer = players[nextGame.players[i - 1]].account;
        } else {
          prevPeer = players[nextGame.players[nextGame.players.length - 1]].account;
        }

        GameStarting(gameId, players[nextGame.players[i]].account, nextPeer, prevPeer);
      }

      // reset nextGame
      nextGame = newGame();
    }

    return true;
  }

  // called by the winner of a round to claim the win
  // can be challenged by the other players
  // TODO: winner must stake a certain amount of Ether against the claim
  function submitWin(uint256 gameId, uint256 roundNum)
    public
    onlyByPlayerForRound(gameId, roundNum)
    returns(bool success)
  {
    require(!rounds[games[gameId].rounds[roundNum]].winSubmitted);
    require(!rounds[games[gameId].rounds[roundNum]].cancelled);

    // RoundProof[] memory prs;

    // Round memory r = Round(msg.sender, true, false, false, false, false, blankProofs);
    // rounds[games[gameId].rounds[roundNum]] = r;
    //rounds[games[gameId].rounds[roundNum]] = blankRound;

    WinSubmitted(gameId, roundNum, msg.sender, games[gameId].roundPayoutAmount);

    return true;
  }

  function claimInvalid(uint256 gameId, uint256 roundNum, address invalidAccount)
    public
    onlyByPlayerForRound(gameId, roundNum)
    returns(bool success)
  {
    require(playerInGame(gameId, invalidAccount));
    require(invalidAccount != msg.sender);
    require(!rounds[games[gameId].rounds[roundNum]].paidOut);
    require(!rounds[games[gameId].rounds[roundNum]].invalidClaim);
    require(!rounds[games[gameId].rounds[roundNum]].provenValid);
    require(!rounds[games[gameId].rounds[roundNum]].cancelled);

    rounds[games[gameId].rounds[roundNum]].invalidClaim = true;

    ClaimedInvalid(gameId, roundNum, invalidAccount, msg.sender);

    return true;
  }

  // submit a player's random number for a round as part of a verification
  // of that round
  // TODO: submit cross-signed hashed random number rather than just random number
  // NOTE: not working at this point
  function submitRoundResult(
    uint256 gameId, 
    uint256 roundNum, 
    address playerAccount, 
    uint256 random)
    public
    onlyByPlayerForRound(gameId, roundNum)
    returns(bool success)
  {
    require(playerInGame(gameId, playerAccount));
    require(!rounds[games[gameId].rounds[roundNum]].paidOut);
    require(rounds[games[gameId].rounds[roundNum]].invalidClaim);
    require(!rounds[games[gameId].rounds[roundNum]].provenValid);
    require(!rounds[games[gameId].rounds[roundNum]].cancelled);

    // TODO: validate the proof
    // TODO: invalid proof, so penalize the offender

    // check if the proof has already been submitted
    bool seenProofAlready = false;
    // uint idxProof;

    // for (idxProof = 0; idxProof < rounds[games[gameId].rounds[roundNum]].proofs.length; idxProof++) {
    //   if (rounds[games[gameId].rounds[roundNum]].proofs[idxProof].account == playerAccount) {
    //     seenProofAlready = true;
    //     break;
    //   }
    // }

    // resubmitted an already "validated" proof; "penalize" the submitter
    // TODO: actual validation and actual penalization
    if (seenProofAlready) {
      rounds[games[gameId].rounds[roundNum]].cancelled = true;
      InvalidProof(gameId, roundNum, playerAccount, msg.sender, random);
      return false;
    }

    // insert the proof
    //RoundProof memory pr = RoundProof(playerAccount, random);
    //rounds[games[gameId].rounds[roundNum]].proofs.push(pr);

    SubmittedRoundResult(gameId, roundNum, playerAccount, msg.sender, random);

    // if all proofs have been submitted, validate the proof
    if (rounds[games[gameId].rounds[roundNum]].proofs.length + 1 == games[gameId].numPlayers) {
      rounds[games[gameId].rounds[roundNum]].provenValid = true;
      ProvenValid(gameId, roundNum, msg.sender);
    }

    return true;
  }

  // winner for a round can withdraw their winnings
  // TODO: require a waiting period between submitting a win and withdrawing the payout
  function payout(
    uint256 gameId, 
    uint256 roundNum)
    public
    onlyByPlayerForRound(gameId, roundNum)
    returns(bool success)
  {
    require(!rounds[games[gameId].rounds[roundNum]].paidOut);
    require(!rounds[games[gameId].rounds[roundNum]].invalidClaim || rounds[games[gameId].rounds[roundNum]].provenValid);
    require(!rounds[games[gameId].rounds[roundNum]].cancelled);
    require(rounds[games[gameId].rounds[roundNum]].winner == msg.sender);

    rounds[games[gameId].rounds[roundNum]].paidOut = true;

    PayWinnings(gameId, roundNum, msg.sender, games[gameId].roundPayoutAmount);

    msg.sender.transfer(games[gameId].roundPayoutAmount);

    return true;
  }
}
