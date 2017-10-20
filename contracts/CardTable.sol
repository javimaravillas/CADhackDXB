pragma solidity ^0.4.11;

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
  event WaitingForGame(address playerAccount, uint256 buyInAmount);
	event ErrorJoiningGame(address playerAccount, uint256 buyInAmount);
  event ConnectToGame(address playerAccount, uint256 gameId, address nextPeer, address prevPeer);
  event PaidWinner(address playerAccount, uint256 gameId, uint256 roundNum, uint256 payoutAmount);
  event PlayerTimeout(address playerAccount, address notifierAccount, uint256 gameId, uint256 roundNum);
  event GameTimeout(address notifierAccount, uint256 gameId);
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
    numPlayers = _numPlayers;
  }

  function updateNumRounds(uint256 _numRounds) public onlyByOwner() {
    numRounds = _numRounds;
  }

  function updateBuyInAmount(uint256 _buyInAmount) public onlyByOwner() {
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

  function joinGame() public payable returns(bool success) {
    require(msg.value >= buyInAmount);
    require(playerExists(msg.sender));

    // add to nextGame

    // if nextGame is full, start the game
  }
}
