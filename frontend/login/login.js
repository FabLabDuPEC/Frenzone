"use strict";
// Socket.io
var socket;
$(document).ready(function() {
    socket = io();
    // TEMPORARY
    $("#accompanyQuestion").toggle();
    $("#question1").toggle();
    constrainTelInput();
    // TEMPORARY TKTKTK 
    var count = document.getElementById('count');
    var questionSubmit = document.getElementById("questionSubmit");
    $("#phoneLookup").submit(lookupUser);
    socket.on('user not found', function(msg) {
        console.log(msg)
        alert("Numéro de téléphone pas trouvé.");
    });
    socket.on('user found', function(user) {
        console.log(user.firstName + " " + user.lastName + " found");
        $("#phoneLookup").toggle();
        $("#userLookup").prepend("<div id=\"welcome\">Bienvenue " + user.firstName + " </div>");
        // $("#accompanyQuestion").toggle(); // toggle accompanyQuestion div
        // create accompanyQuestion div
        $("#phoneLookup").after("<div id=\"accompanyQuestion\" class=\"question\"><form id=\"accompanyingForm\" onSubmit=\"return false;\"><label for=\"accompanyCount\">Es-tu accompagné d\'autres personnes aujourd\'hui ?</label><br><input type=\"number\" id=\"accompanyCount\" name=\"accompanyCount\" value=\"0\" min=\"0\" max=\"99\"><br><input id=\"submit\" type=\"submit\" value=\"suivant\"></form></div>");
        // Accompany count form submission behavior
        $("#accompanyingForm").submit(function() {
            socket.emit('accompanying count', $("#accompanyCount").val(), user.userID); // send accompany count to server
            $("#accompanyQuestion").after("<div class=\"question\" id=\"question1\"><label for=\"textInput\">question question question question</label><textarea id=\"textInput\" maxlength=\"200\"></textarea><div id=\"count\">200</div><input id=\"questionSubmit\" type=\"button\" value=\"sauter la question\"></div>");
            $("#accompanyQuestion").toggle();
            setupTextInput();
        });
    });
});

function setupTextInput() {
    var textInput = document.getElementById('textInput');
    textInput.onkeyup = function() { // Characters remaining counter
        count.innerHTML = (200 - this.value.length);
        if (count.innerHTML < 40 && count.innerHTML >= 20) {
            count.style.color = "orange";
        } else if (count.innerHTML < 20) {
            count.style.color = "red";
        } else { count.style.color = "black" }
        if (textInput.value.length > 0) {
            questionSubmit.value = "soumettre";
        } else { questionSubmit.value = "sauter la question" }
    };
}

function constrainTelInput() {
    var phones = [{ "mask": "(###) ###-####" }, { "mask": "(###) ###-##############" }];
    $('#phone').inputmask({
        mask: phones,
        greedy: false,
        definitions: { '#': { validator: "[0-9]", cardinality: 1 } }
    });
};

function lookupUser() {
    var phone = document.getElementById("phone").value;
    var phoneNumberOnly = phone.replace(/\D/g, '');
    console.log(phoneNumberOnly)
    var obj = { "phone": phoneNumberOnly };
    socket.emit("phone lookup", phoneNumberOnly);

    // OLD AND DEAD EXPRESS XHR CRAP TO BE REMOVED WHEN SOCKET IS BATTLE HARDENED
    //     // lookup user by telephone number
    //     var xhr = new XMLHttpRequest();
    //     xhr.open("POST", "/login/lookupUser"); // Configures the get request, with async default to true: XMLHttpRequest.open(method, url, async)
    //     xhr.setRequestHeader("Content-type", "text/plain"); // content type is application/json NOT application/javascript 
    //     xhr.onreadystatechange = function() { //Call a function when the state changes.
    //         if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
    //             console.log("server response " + this.responseText);
    //             if (this.responseText != "not found") {
    //                 $("#phoneLookup").toggle();
    //     $("#userLookup").prepend("<div id=\"welcome\">Bienvenue " + this.responseText + " </div>");
    //                 $("#accompanyQuestion").toggle();
    //             }
    //         }
    //     }
    //     xhr.send(JSON.stringify(phoneNumberOnly)); // send get request to server
};