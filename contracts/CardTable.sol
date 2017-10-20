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
    uint256 winAmount;
    bool paidOut;
  }

  // game composed of players and rounds
  struct Game {
    uint256 id;
    uint256 numPlayers;
    uint256 numRounds;
    uint256 buyInAmount;
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
  event PaidWinner(uint256 gameId, address playerAccount, uint256 roundNum, uint256 payoutAmount);
  event PlayerTimeout(uint256 gameId, address playerAccount, address notifierAccount, uint256 roundNum);
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
  function getPlayer(address playerAccount) private returns(Player p) {
    return players[addressToPlayer[playerAccount]];
  }

  // create a new, blank game (typically nextGame)
  function newGame() private returns(Game g) {
    Player[] ps;
    Round[] rs;

    // note that gameId will be initialized to 0, but must be set correctly 
    // when game is added to games array
    g = Game(0, numPlayers, numRounds, buyInAmount, ps, rs);

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
}
