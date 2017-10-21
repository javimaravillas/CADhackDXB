import React, {Component } from 'react';


const RegisterForm = ({contractInstance, address, web3}) => {

    let name;

    const register = () => {
	console.log({address});
	web3.eth.getTransactionCount(address, (err, nonce) => {
	    console.log({nonce});
	    contractInstance.registerPlayer(name, {from:address, gas: 1000000, gasPrice: 1000, nonce} ).then(() => {
		console.log("Player registered");
		window.location.reload();
	    });
	});
    };

    if (!contractInstance) {
	return (<div> loading... </div>);
    }
    
    return (
	<div>
	    <h2> Register Form </h2>
	    <input onChange={(e) => (name = e.target.value)} placeholder="Name" />
	    <button onClick={() => register()}> Register </button>
	</div>
    );
}

export default RegisterForm;
