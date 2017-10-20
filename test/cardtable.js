var CardTable = artifacts.require("./CardTable.sol");

function allGasUsedUp(txn) {
  // check that given transaction didn't throw an exception by running out of gas
  var tx = web3.eth.getTransaction(txn.tx);
  var txr = txn.receipt;

  return txr.gasUsed === tx.gas;
}

contract('CardTable', function(accounts) {
  var ct;

  var u = {
    p0: accounts[0],
    p1: accounts[1],
    p2: accounts[2],
  };

  beforeEach(function() {
    return CardTable.new({from: u.p0})
    .then(function(instance) {
      ct = instance;
    });
  });

  it("should register three new players", function() {
    return ct.registerPlayer("Player 0", {from: u.p0})
    .then(function(txn) {
      // check that an exception wasn't thrown
      assert.isNotTrue(allGasUsedUp(txn), "All gas was used up, registerPlayer() threw an exception.");

      return web3.eth.getBalance(contract.address);
    });
  });

});
