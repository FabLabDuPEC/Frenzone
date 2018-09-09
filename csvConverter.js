"use strict";

var path = require('path'); // node module for working with directory and file paths
const fs = require('fs'); // node module for working with the filesystem

// TKTKTKTK when finished relocate the subsequent code to the function call below
// 1. Fetch data from disk
var usersDB = null;
var users = null;
var visitsDB = null;
var visits = null;
var rowCount = 0;
var visitsArray = [];
// read db.json
fs.readFile('db.json', processUsersDB); // read database, callback gets passed err and data
function processUsersDB(err, data) {
    if (err) throw err; // handles readFile error
    usersDB = JSON.parse(data);
    users = usersDB.members;
}
// read visits.json
fs.readFile('visits.json', processVisitsDB);

function processVisitsDB(err, data) {
    if (err) throw err;
    visitsDB = JSON.parse(data);
    visits = visitsDB.visits;
    createVisitsTable();
}

// 2. Combine information from two databases into a single table
function createVisitsTable() {
    // Create a first element in the array, which contains the column names as values
    var header = {
        date: "Date",
        userID: "User ID",
        firstName: "Prenom",
        lastName: "Nom de famille",
        visitorCount: "Nombre de personnes",
        researchProduction: "Recherche/Production",
        personalProfessional: "Personnel/Professionnel",
        dayOfWeek: "Jour de la semaine",
        timeOfDay: "L'heure de visite",
        memberType: "Type de membre"
    };
    visitsArray.push(header);
    for (var i = 0; i < visits.length; i++) {
        for (var j = 0; j < visits[i].visitorList.length; j++) {
            // Prepare day of week
            var rawDate = visits[i].date.split('-');
            var visitDate = new Date(rawDate[0], rawDate[1], rawDate[2]);
            var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            var dayOfWeek = weekdays[visitDate.getDay()];
            // Prepare time of day
            var rawTime = new Date(visits[i].visitorList[j].time);
            var timeOfDay = rawTime.getHours() + ":" + rawTime.getMinutes();
            //prepare data from users database
            var user = users[(visits[i].visitorList[j].user - 1)];
            // Create row object representing one sign-in to Frenzone
            var row = {
                date: visits[i].date,
                userID: visits[i].visitorList[j].user,
                firstName: user.firstName,
                lastName: user.lastName,
                visitorCount: (visits[i].visitorList[j].accompanied + 1),
                researchProduction: visits[i].visitorList[j].researchProduction,
                personalProfessional: visits[i].visitorList[j].personalProfessional,
                dayOfWeek: dayOfWeek,
                timeOfDay: timeOfDay,
                memberType: user.memberType
            }
            visitsArray.push(row);
        }
    }

    // 3. Convert table to CSV
    var now = new Date();
    var shortDate = now.toJSON().substring(0, 10);
    convertJSONtoCSV(visitsArray, shortDate);
}


function convertJSONtoCSV(JSONData, ReportTitle) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    var CSV = '';

    // //This condition will generate the Label/Header
    // if (ShowLabel) {
    //     var row = "";

    //     //This loop will extract the label from 1st index of on array
    //     for (var index in arrData[0]) {

    //         //Now convert each value to string and comma-seprated
    //         row += index + ',';
    //     }

    //     row = row.slice(0, -1);

    //     //append Label row with line break
    //     CSV += row + '\r\n';
    // }

    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";

        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }

        row.slice(0, row.length - 1);

        //add a line break after each row
        CSV += row + '\r\n';
    }

    if (CSV == '') {
        alert("Invalid data");
        return;
    }

    //Generate a file name
    var fileName = "FabLab Rapport De Visites ";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g, "_");
    fileName += ".csv";

    fs.writeFile(fileName, CSV, err => {
        if (err) throw err;
    });
}

/*
    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension    

    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");
    link.href = uri;

    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";

    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

*/