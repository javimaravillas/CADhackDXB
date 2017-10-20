var CardTable = artifacts.require("./CardTable.sol");

function allGasUsedUp(txn) {
  // check that given transaction didn't throw an exception by running out of gas
  var tx = web3.eth.getTransaction(txn.tx);
  var txr = txn.receipt;

  return txr.gasUsed === tx.gas;
}

contract('CardTable', function(accounts) {
  var contract;

  var u = {
    p0: accounts[0],
    p1: accounts[1],
    p2: accounts[2],
  };

  var buyInAmount = web3.toWei(10, "ether");

  beforeEach(function() {
    return CardTable.new({from: u.p0})
    .then(function(instance) {
      contract = instance;
    });
  });

  it("should register three new players, they join a game, and the game starts", function() {
    return contract.registerPlayer("Player 0", {from: u.p0})
    .then(function(txn) {
      // check that an exception wasn't thrown
      assert.isNotTrue(allGasUsedUp(txn), "All gas was used up, registerPlayer() threw an exception.");

      return contract.registerPlayer("Player 1", {from: u.p1})
    })
    .then(function(txn) {
      // check that an exception wasn't thrown
      assert.isNotTrue(allGasUsedUp(txn), "All gas was used up, registerPlayer() threw an exception.");

      return contract.registerPlayer("Player 2", {from: u.p2})
    })
    .then(function(txn) {
      // check that an exception wasn't thrown
      assert.isNotTrue(allGasUsedUp(txn), "All gas was used up, registerPlayer() threw an exception.");

      return contract.playersCount();
    })
    .then(function(count) {
      assert.equal(count, 3, "Did not register the expected number of players.");
    
      return contract.joinGame({from: u.p0, value: buyInAmount})
    })
    .then(function(txn) {
      // check that an exception wasn't thrown
      assert.isNotTrue(allGasUsedUp(txn), "All gas was used up, joinGame() threw an exception.");

      return contract.joinGame({from: u.p1, value: buyInAmount})
    })
    .then(function(txn) {
      // check that an exception wasn't thrown
      assert.isNotTrue(allGasUsedUp(txn), "All gas was used up, joinGame() threw an exception.");

      return contract.joinGame({from: u.p2, value: buyInAmount})
    })
    .then(function(txn) {
      // check that an exception wasn't thrown
      assert.isNotTrue(allGasUsedUp(txn), "All gas was used up, joinGame() threw an exception.");

      assert.strictEqual(txn.receipt.logs.length, 2);
      assert.strictEqual(txn.logs.length, 2);
      const logGameStarting = txn.logs[1];
      assert.strictEqual(logGameStarting.event, "GameStarting");
    });
  });

});
