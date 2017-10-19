pragma solidity ^0.4.11;

contract CardTable {
  // player
  struct Player {
		address account;
		string name;
		uint256 balance;
    uint256 gamesPlayed;
    uint256 gamesWon;
    uint256 gamesLost;
    uint256 gamesAborted;
    bool inAGame;
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

  event WaitingForGame(address playerAccount, uint256 buyInAmount, uint256 balance);
	event ErrorJoiningGame(address playerAccount, uint256 buyInAmount, uint256 balance);
  event ConnectToGame(address playerAccount, uint256 gameId, address nextPeer, address prevPeer);
  event PaidWinner(address playerAccount, uint256 gameId, uint256 roundNum, uint256 payoutAmount);
  event PlayerTimeout(address playerAccount, address notifierAccount, uint256 gameId, uint256 roundNum);
  event GameTimeout(address notifierAccount, uint256 gameId);
  event PayoutTimeout(uint256 gameId, uint256 roundNum, uint256 payoutAmount);
  event GameFinished(uint256 gameId);

  modifier onlyByOwner()
	{
		require(msg.sender == owner);
		_;
	}

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
}
