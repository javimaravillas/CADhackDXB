import React, {Component } from 'react';


const RegisterForm = () => {

    let name;

    const register = () => {
	alert(name);
    };
    
    return (
	<div>
	    <h2> Register Form </h2>
	    <input onChange={(e) => (name = e.target.value)} placeholder="Name" />
	    <button onClick={() => register()}> Register </button>
	</div>
    );
}

export default RegisterForm;
