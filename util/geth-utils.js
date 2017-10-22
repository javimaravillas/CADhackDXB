function spreadWealth() {
    if (k < eth.accounts.length) { 
        console.log("Send Eth to account " + k + ": " + 
        eth.sendTransaction({from: eth.accounts[0], to: eth.accounts[k], value: web3.toWei(0.5, "ether")}));
        k++;
        setTimeout(spreadWealth, 2000);
    } else {
        k = 0;
        setTimeout(spreadWealth, 2000);
    }
}

for (var i = 0; i < eth.accounts.length; i++) { console.log(personal.unlockAccount(eth.accounts[i], "", 86400)); }

for (var i = 0; i < eth.accounts.length; i++) {console.log(eth.accounts[i] +": " + web3.fromWei(eth.getBalance(eth.accounts[i])), "ether");}

