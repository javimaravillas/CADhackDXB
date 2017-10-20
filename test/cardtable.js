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

  var buyInAmount = 10;

  beforeEach(function() {
    return CardTable.new({from: u.p0})
    .then(function(instance) {
      contract = instance;
    });
  });

  it("should register three new players", function() {
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
    });
  });

  // it("three players should join a game and the game should start", function() {
  //   return contract.joinGame({from: u.p0, value: buyInAmount})
  //   .then(function(txn) {
  //     // check that an exception wasn't thrown
  //     assert.isNotTrue(allGasUsedUp(txn), "All gas was used up, joinGame() threw an exception.");
  //   });
  // });

});
