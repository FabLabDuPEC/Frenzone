"use strict";

//store user data in json and save to disk
$(document).ready(function() {
    drawCompetencies();
    constrainTelInput();
});

function showSignUp() {
    $("#pathSelect").toggle();
    $("#greenGradient").toggle();
}

function login() {
    window.location.href = "/login";
}

function backButton() {
    $("#greenGradient").toggle();
    $("#pathSelect").toggle();
}

function constrainTelInput() {
    var phones = [{ "mask": "(###) ###-####" }, { "mask": "(###) ###-##############" }];
    $('#phone').inputmask({
        mask: phones,
        greedy: false,
        definitions: { '#': { validator: "[0-9]", cardinality: 1 } }
    });
};

var competenciesArray = []; // create global variable for competencies array

// add competency list to DOM as checkboxes
function drawCompetencies() {
    //load json
    var requestPath = "../resources/listeDeCompetence.json";
    var request = new XMLHttpRequest();
    request.open('GET', requestPath);
    request.responseType = 'json';
    request.send();
    request.onload = function() {
        var response = request.response; // assign variable to competencies object
        competenciesArray = response.Competencies; // create array of competencies
        var competenciesDiv = document.getElementById("competencies");

        competenciesArray.forEach(function(element) { // for each competency
            var div = document.createElement("div"); // create div element
            div.innerHTML = " " + element; // insert text
            div.setAttribute("id", element); // set competency as div's id
            var checkbox = document.createElement("input"); // create input element
            checkbox.setAttribute("type", "checkbox"); // add checkbox attribute
            checkbox.setAttribute("name", element); // add name attribute
            checkbox.setAttribute("value", element); // add value attribute
            div.insertBefore(checkbox, div.childNodes[0]); // insert checkbox input before div's label
            competenciesDiv.appendChild(div); // add to DOM
        });
    }
}


// TKTKTK should not trigger if required fields are empty.
function saveUser() {
    var form = document.getElementById("newUserForm"); // select form
    // check if form is valid
    if (!form.checkValidity()) {
        console.log("fails")
        alert("Assurez-vous de répondre à toutes les questions mandatoires.");
        return;
    }
    var skills = []; // create skills array
    competenciesArray.forEach(function(element) { // for each skill
        var checkbox = document.getElementsByName(element); // get each corresponding checkbox
        if (checkbox[0].checked == true) { // if a given box is checked
            skills.push(element); // add to skills array
        }
    });
    var today = new Date();
    var month = null;
    if (today.getMonth() < 10) {
        month = 0 + today.getMonth();
    } else { month = today.getMonth() }
    var dateCreated = today.getFullYear() + "-" + month + "-" + today.getDate();
    var phone = form.phone.value;
    var phoneNumberOnly = phone.replace(/\D/g, ''); // reduce phone to only numbers
    var newUser = { // create new user object
        "userID": "",
        "firstName": form.firstName.value,
        "lastName": form.lastName.value,
        "dateCreated": dateCreated,
        "phone": phoneNumberOnly,
        "email": form.email.value,
        "birthDate": form.birthDate.value,
        "postalCode": form.postalCode.value,
        "memberType": form.memberType.value,
        "hadAlreadyVisitedALab": form.dejaFabLab.value,
        "referral": form.commentEntendu.value,
        "skills": skills,
        "visits": [dateCreated],
        "projects": []
    };
    // console.log("new user:");
    // console.log(newUser);

    if (form.ethnicOrigin.value == "") {
        form.ethnicOrigin.value = "Quebec";
    };

    var anonData = {
        "dateCreated": dateCreated,
        "expectations": form.expectations.value,
        "gender": form.gender.value,
        "maritalStatus": form.maritalStatus.value,
        "headOfHousehold": form.chefDeFam.value,
        "origin": form.ethnicOrigin.value,
        "schoolLevel": form.schoolLevel.value,
        "workStatus": form.workStatus.value,
        "annualRevenue": form.annualRevenue.value,
        "residence": form.residence.value,
        "activityAtPEC": form.activity.value
    };
    // console.log("anon data:");
    // console.log(anonData);

    // configure and send POST request to server
    // var userData = [newUser, anonData];
    var userData = [newUser, anonData];
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/saveUser"); // Configures the post request, with async default to true: XMLHttpRequest.open(method, url, async)
    xhr.setRequestHeader("Content-type", "application/json"); // content type is application/json NOT application/javascript 
    xhr.onreadystatechange = function() { //Call a function when the state changes.
        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            // console.log("Post request complete."); // Request finished.
            var parsed = JSON.parse(this.responseText);
            console.log(parsed.message); // Print server's reply to console
            if (parsed.hasOwnProperty("redirect")) {
                console.log(parsed.redirect); // Print server's redirect path
                window.location.assign(parsed.redirect); // Redirect to new path  
            } else {
                alert(document.getElementById("newUserForm").phone.value + " est déjà associé avec un membre. Inserez un autre numéro de téléphone et soumettre la formulaire de nouveau.")
            }
        }
    }
    xhr.send(JSON.stringify(userData)); // send post request to server
}



// var newObj = 
// {  "name": "Nicholas", 
//  "type": "regular member", 
//  "projects": {
//    "camera glasses" : {
//      "skills" : ["Blender","Github", "CNC 3D forms", "electronics", "Eagle", "CNC PCB"],
//      "dates worked on" : ["2015-12-01", "2016-01-31"]
//    },
//    "microscopic 3D reconstruction": {
//      "skills" : ["microscopy", "motors", "Reality Capture", "photogrammetry", "laser cutting"],
//      "dates worked on" : ["2018-04-15", "2018-05-01"]
//    }
//  }
// }

// console.log(newObj);

// var stringObj = JSON.stringify(newObj);

// localStorage.setItem("userLog", stringObj);
// console.log("stored item");

// var imported = localStorage.getItem("userLog");
// console.log("userLog contains");
// console.log(JSON.parse(imported));


/*
// ACCESSING PROPERTIES OF UNKNOWN OBJECT
for (i in x){
  x.elements[i].value 
}


// ITERATING THROUGH ARRAY NESTED IN JSON OBJECT
var myObj, i, x = "";
myObj = {
    "name":"John",
    "age":30,
    "cars":[ "Ford", "BMW", "Fiat" ]
};

for (i in myObj.cars) {
    x += myObj.cars[i] + "<br>";
}
document.getElementById("demo").innerHTML = x;



// NESTED OBJECTS
myObj = {
    "name":"John",
    "age":30,
    "cars": {
        "car1":"Ford",
        "car2":"BMW",
        "car3":"Fiat"
    }
 } 


// ARRAYS
{
"name":"John",
"age":30,
"cars":[ "Ford", "BMW", "Fiat" ]
} 

*/