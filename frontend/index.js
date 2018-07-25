"use strict";

//store user data in json and save to disk
$(document).ready(function() {
    $("#greenGradient").toggle();
});

function signUp(){
    window.location.href = "/signup";
}

function login() {
    window.location.href = "/login";
}