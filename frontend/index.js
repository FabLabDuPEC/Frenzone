//store user data in json and save to disk
window.onload = function() {
  drawCompetencies();
};

var competenciesArray = []; // create global variable for competencies array

// add competency list to DOM as checkboxes
function drawCompetencies() {
  //load json
  var requestPath = "resources/listeDeCompetence.json";
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
  var skills = []; // create skills array
  competenciesArray.forEach(function(element) { // for each skill
    var checkbox = document.getElementsByName(element); // get each corresponding checkbox
    if (checkbox[0].checked == true) { // if a given box is checked
      skills.push(element); // add to skills array
    }
  });
  var newUser = { // create new user object
    "firstName": form.firstName.value,
    "lastName": form.lastName.value,
    "phone": form.phone.value,
    "email": form.email.value,
    "postalCode": form.postalCode.value,
    "memberType": form.memberType.value,
    "hadAlreadyVisitedALab": form.dejaFabLab.value,
    "referral": form.commentEntendu.value,
    "skills": skills,
  };
  console.log("new user:");
  console.log(newUser);

  var anonData = {
    "gender": form.gender.value,
    "expectations": form.expectations.value,
    "maritalStatus": form.maritalStatus.value,
    "headOfHousehold": form.chefDeFam.value,
    "origin": form.ethnicOrigin.value,
    "schoolLevel":form.schoolLevel.value,
    "workStatus": form.workStatus.value,
    "annualRevenue": form.annualRevenue.value,
    "residence": form.residence.value,
    "activityAtPEC": form.activity.value
  }; 
  // TKTK finish anonymous data collection
  console.log("anon data:");
  console.log(anonData);
  // post data to backend
  // if backend replies that phone or email is already in db, refuse to submit
  // else success message and reset screen
}






// var newObj = 
// {  "name": "Nicholas", 
//  "type": "regul  ar member", 
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