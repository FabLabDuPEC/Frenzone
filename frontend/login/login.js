"use strict";
// Socket.io
var socket;
var accompanyingCount = null;
var userID = null;
$(document).ready(function() {
    socket = io();
    // TEMPORARY
    $("#accompanyQuestion").toggle();
    $("#question1").toggle();
    $("#svg").toggle();
    constrainTelInput();
    $("#backButton").click(() => { window.history.back() });
    // TEMPORARY TKTKTK 
    var count = document.getElementById('count');
    var questionSubmit = document.getElementById("questionSubmit");
    $("#phoneLookup").submit(lookupUser);
    socket.on('user not found', function(msg) {
        console.log(msg)
        alert("Numéro de téléphone pas trouvé.");
    });
    socket.on('user found', function(user, firstVisit) {
        console.log(user);
        console.log(firstVisit);
        if (firstVisit === true) { //If this is the user's first login today
            userID = user.userID;
            console.log(user.firstName + " " + user.lastName + " found");
            $("#phoneLookup").toggle();
            $("#userLookup").prepend("<div id=\"welcome\">Bienvenue " + user.firstName + " (membre #" + user.userID + ")</div>");
            // var ieme = "e";
            // var superIeme = ieme.sup();
            // if(user.visits.length === 0){
            //     $("#welcome").after("C'est la première fois que tu te connecte avec moi !");
            // } else {
            //      $("#welcome").after("<div>Bienvenue pour la " + user.visits.length + superIeme + " fois.</div>")
            // }

            // If the member must pay for membership again
            var lastPaidMembership = new Date(user.lastPaidMembership);
            var difference = (new Date(newShortDate()) - lastPaidMembership) / (1000 * 60 * 60 * 24);
            console.log(lastPaidMembership + " " + difference);
            if (difference > 365) {
                // alert("Merci de votre fidélité au Fab Lab. Il fait " + difference + " jours depuis votre dernier abonnement annuel au Fab Lab (30$). Réabonnez-vous aujourd’hui avec un membre de l’équipe lorsque vous passez à la caisse.");
                $("<div>Merci de votre fidélité au Fab Lab. C’est le moment de renouveler votre abonnement annuel! Réabonnez-vous aujourd’hui avec un membre de l’équipe lorsque vous passez à la caisse.</div>").dialog({
                    modal: true,
                    buttons: {
                        OK: function() {
                            $(this).dialog("close");
                        }
                    },
                    dialogClass: "no-close",
                    draggable: false,
                    minWidth: 600
                });
            }
            // create accompanyQuestion div
            $("#phoneLookup").after("<div id=\"accompanyQuestion\" class=\"question\"><form id=\"accompanyingForm\" onSubmit=\"return false;\"><label for=\"accompanyCount\">Es-tu accompagné.e d\'autres personnes aujourd\'hui ?</label><br><input type=\"number\" id=\"accompanyCount\" name=\"accompanyCount\" value=\"0\" min=\"0\" max=\"99\" required autofocus><br><input id=\"submit\" type=\"submit\" value=\"suivant\"></form></div>");
            $("#accompanyCount").focus();
            // Accompany count form submission behavior
            // var accompanyCount = $("#accompanyCount").val();
            $("#accompanyingForm").submit(function() {
                accompanyingCount = $("#accompanyCount").val();
                $("#welcome").after("<div id=\"sliderLabel\">Comment décririez-vous votre visite au lab aujourd'hui ?");
                $("#svg").toggle();
                $("#accompanyQuestion").toggle();
            });
        } else {
            // If the user has already logged in today.
            alert("Vous êtes déjà connectez aujoud'hui. Pour le moment il n'y a rien à faire sauf répondre à la questionnaire...");
        }
    });
    // socket.on('slider svg', function(svg) { // when receiving slider svg from server
    // move this to after slider step
    // $("#accompanyQuestion").after("<div class=\"question\" id=\"question1\"><label for=\"textInput\">question question question question</label><textarea id=\"textInput\" maxlength=\"200\"></textarea><div id=\"count\">200</div><input id=\"questionSubmit\" type=\"button\" value=\"sauter la question\"></div>");
    // move this to after slider step
    // setupTextInput();

    // });
});

function selectVisitPurpose(researchProduction, personalProfessional) {
    socket.emit('save visit', accompanyingCount, userID, researchProduction, personalProfessional); // send accompany count to server
    $("#svg").after('<div id=\"thankyou\"><div id="whiteBox"><div>Merci d\'avoir visité le lab :)</div><br><button id="reset" onclick="reset()">Réinitialiser</button></div></div>');
    // $("#svg").after('<div id="resetContainer"><button id="reset"></button></div>')
    $("#sliderLabel").toggle();
    $("#svg").toggle(); // toggle off and thanks
}


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

function reset() {
    window.location.href = "/";
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

function newShortDate() {
    var now = new Date();
    return now.toJSON().substring(0, 10);
}