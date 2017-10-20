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
    uint256 payoutAmount;
    bool winSubmitted;
    bool paidOut;
    bool playerTimeoutClaim;
    bool invalidWinClaim;
  }

  // game composed of players and rounds
  struct Game {
    uint256 id;
    uint256 numPlayers;
    uint256 numRounds;
    uint256 buyInAmount;
    uint256 roundPayoutAmount;
		Player[] players;
    Round[] rounds;
	}

  Game[] public games;

  // global state variables with defaults where available
  address public owner;
  uint256 numPlayers = 3;
  uint256 numRounds = 10;
  uint256 buyInAmount = numRounds * 1 ether;

  Game nextGame;  // game waiting to be filled with players

  // events
  event RegisteredPlayer(uint256 playerId, address playerAccount, string name);
  event WaitingForGame(uint256 gameId, address playerAccount, uint256 buyInAmount);
  event GameStarting(uint256 gameId, address playerAccount, address nextPeer, address prevPeer);
  event WinSubmitted(uint256 gameId, uint256 roundNum, address winnerAccount, uint256 payoutAmount);
  event ClaimedPlayerTimeout(uint256 gameId, uint256 roundNum, address timeoutAccount, address notifierAccount);
  event ClaimedInvalidWin(uint256 gameId, uint256 roundNum, address invalidWinAccount, address notifierAccount);
  event GameTimeout( uint256 gameId, address notifierAccount);
  event PayoutTimeout(uint256 gameId, uint256 roundNum, uint256 payoutAmount);
  event GameFinished(uint256 gameId);

  // modifiers
  modifier onlyByOwner()
	{
		require(msg.sender == owner);
		_;
	}

  // constructor and functions
  function CardTable() {
		owner = msg.sender;
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

    Player p = Player(msg.sender, name);

    // update index mapping and players array in one step, saving on gas
    addressToPlayer[msg.sender] = players.push(p) - 1;
		uint256 id = players.length - 1;

		RegisteredPlayer(id, msg.sender, name);

    return true;
  }

  // retrieve a player from the registry
  function getPlayer(address playerAccount) private constant returns(Player p) {
    return players[addressToPlayer[playerAccount]];
  }

  // check if a player is in a game
  function playerInGame(uint256 gameId, address playerAccount) private constant returns(bool exists) {
    for (uint i = 0; i < games[gameId].players.length; i++) {
      if (games[gameId].players[i].account == playerAccount) {
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
      if (nextGame.players[i].account == playerAccount) {
        return true;
      }
    }

    return false;
  }

  // create a new, blank game (typically nextGame)
  function newGame() private returns(Game g) {
    Player[] ps;
    Round[] rs;

    uint256 roundPayoutAmount = buyInAmount / numPlayers;

    // note that gameId will be initialized to 0, but must be set correctly 
    // when game is added to games array
    g = Game(0, numPlayers, numRounds, buyInAmount, roundPayoutAmount, ps, rs);

    return g;
  }

  // add a game (typically nextGame) to the games array
  function addGame(Game g) private returns(bool success) {
    // retrieve id as part of array addition to save on gas
    uint256 id = games.push(g) - 1;
    games[id].id = id;

    return true;
  }

  // called by a player who wishes to join a game
  function joinGame() public payable returns(bool success) {
    require(msg.value == buyInAmount);
    require(playerExists(msg.sender));
    require(!playerInNextGame(msg.sender));

    // add to nextGame
    Player memory p = getPlayer(msg.sender);
    nextGame.players.push(p);
    WaitingForGame(nextGame.id, msg.sender, buyInAmount);

    // if nextGame is full, start the game
    if (nextGame.players.length == nextGame.numPlayers) {

      // notify the players to connect to their peers
      for (uint i = 0; i < nextGame.players.length; i++) {
        address nextPeer;
        address prevPeer;

        if (i < nextGame.players.length - 1) {
          nextPeer = nextGame.players[i + 1].account;
        } else {
          nextPeer = nextGame.players[0].account;
        }

        if (i > 0) {
          prevPeer = nextGame.players[i - 1].account;
        } else {
          prevPeer = nextGame.players[nextGame.players.length - 1].account;
        }

        GameStarting(nextGame.id, nextGame.players[i].account, nextPeer, prevPeer);

        // add game to games array
        addGame(nextGame);
      }

      // reset nextGame
      nextGame = newGame();
    }

    return true;
  }

  // called by the winner of a round to claim the win
  // can be challenged by the other players
  // TODO: winner must stake a certain amount of Ether against the claim
  function submitWin(uint256 gameId, uint256 roundNum) public returns(bool success) {
    require(roundExists(gameId, roundNum)); // will also verify that game exists
    require(playerInGame(gameId, msg.sender));
    require(!games[gameId].rounds[roundNum].winSubmitted);
    require(!games[gameId].rounds[roundNum].paidOut);

    Round r = Round(msg.sender, games[gameId].roundPayoutAmount, true, false, false, false);
    games[gameId].rounds[roundNum] = r;

    WinSubmitted(gameId, roundNum, msg.sender, games[gameId].roundPayoutAmount);

    return true;
  }

  function claimPlayerTimeout(uint256 gameId, uint256 roundNum, address timeoutAccount)
    public
    returns(bool success)
  {
    require(roundExists(gameId, roundNum)); // will also verify that game exists
    require(playerInGame(gameId, msg.sender));
    require(playerInGame(gameId, timeoutAccount));
    require(timeoutAccount != msg.sender);
    require(!games[gameId].rounds[roundNum].paidOut);
    require(!games[gameId].rounds[roundNum].playerTimeoutClaim);

    games[gameId].rounds[roundNum].playerTimeoutClaim = true;

    ClaimedPlayerTimeout(gameId, roundNum, timeoutAccount, msg.sender);

    return true;
  }

  function claimInvalidWin(uint256 gameId, uint256 roundNum, address invalidWinAccount)
    public
    returns(bool success)
  {
    require(roundExists(gameId, roundNum)); // will also verify that game exists
    require(playerInGame(gameId, msg.sender));
    require(playerInGame(gameId, invalidWinAccount));
    require(invalidWinAccount != msg.sender);
    require(games[gameId].rounds[roundNum].winSubmitted);
    require(!games[gameId].rounds[roundNum].paidOut);
    require(!games[gameId].rounds[roundNum].invalidWinClaim);

    games[gameId].rounds[roundNum].invalidWinClaim = true;

    ClaimedInvalidWin(gameId, roundNum, invalidWinAccount, msg.sender);

    return true;
  }
}
