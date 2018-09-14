"use strict";

const express = require('express'); // node module that routes http requests
const app = express(); // initialized express 
var http = require('http').Server(app);
var path = require('path'); // node module for working with directory and file paths
const fs = require('fs'); // node module for working with the filesystem
var bodyParser = require('body-parser'); // node module middleware for parsing incoming requests before handing off to other server-side functions 
const { body, validationResult } = require('express-validator/check');
var io = require('socket.io')(http);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.text()); // support text encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static("frontend")); // serve index.html, style.css, index.js, and other files from the path passed as a string

http.listen(8080, function() { // serve content to localhost:8080
    console.log('listening on *:8080');
});

// On HTTP POST save user data
// tutorial about handling POST requests https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
var receive = function(req, res, next) { // receive data from Submit button in sign-up
    console.log("received " + req.body[0].firstName + " data from client");
    res.locals.newUser = req.body[0]; // store new user data from client's form in res object, do not need to JSON.parse
    res.locals.anonData = req.body[1]; // store anonymous data for PEC, do not need to JSON.parse
    next();
};
var respond = function(req, res, next) {
    var newUser = res.locals.newUser;
    var anonData = res.locals.anonData;
    /// TKTKTK remove all the ifs and just return based on whether createUser succeeds
    createUser(newUser, res);
}

// Create user and write to database
function createUser(newUser, res) {
    fs.readFile('db.json', verify); // callback gets passed err and data

    function verify(err, data) {
        if (err) throw err; // handles readFile error
        var database = JSON.parse(data); // parse the database
        if (database.hasOwnProperty('members')) { // check that database is initialized
            var userCount = database.numberOfUsers;
            console.log("Verify: number of users already in database: " + userCount);
            // Check if there is a discrepancy between 
            var IDinDB = function(element) { // function run on every element
                return element.userID == userCount + 1;
            };
            if (database.members.some(IDinDB)) { // return true as soon as any matching element is found
                throw Error("Discrepancy between database's user count and number of members. Looks like the next userID # has already been assigned.");
                res.send({ message: "Database error: discrepancy between database user count and number of members in the database. Check db.json." });
            }
            var phoneInDB = function(element) { // function run on every element
                return element.phone == newUser.phone;
            };
            if (database.members.some(phoneInDB)) {
                console.log("New user's phone number " + newUser.phone + " already in database.");
                res.send({ message: newUser.phone + " already in the database." });
            } else {
                write(database, userCount);
            }
        } else {
            console.log("Database is empty. Restore db.json from backup and restart the server.")
            res.send({ message: "Database is empty. Restore db.json from backup and restart the server." })
        }
    };

    function write(database, userCount) {
        newUser.userID = userCount + 1;
        database.numberOfUsers++; // increment user count in database
        database.members.push(newUser); // add new user to database
        fs.writeFile("db.json", JSON.stringify(database), err => { // write database to disk
            if (err) throw err;
        });
        console.log("Wrote " + newUser.firstName + " to database");
        // console.log(newUser)
        // write anon data to anonPecDb.json
        fs.readFile('anonPecDb.json', (err, data) => {
            if (err) throw err;
            var anondb = JSON.parse(data); // parse the db
            console.log("read anonPecDb.json");
            // console.log(anondb);
            console.log("adding new user to anondb and writing to disk");
            anondb.anonData.push(res.locals.anonData)
            fs.writeFile("anonPecDb.json", JSON.stringify(anondb), err => {
                if (err) throw err;
            });
        });
        res.status(200).send({ message: "Success, wrote user to database.", redirect: "/login" }); // Send successful response and redirect to client
    };
}

app.post('/saveUser', [receive, respond]); // array of functions that sequentially handle the request 

app.get('/success', (req, res) =>
    res.send("success placeholder route"))

app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/frontend/login/login.html");
});

app.post('/login/lookupUser', (req, res) => {
    var phoneNum = JSON.parse(req.body);
    console.log("received: " + req.body)
    fs.readFile("db.json", (err, data) => {
        if (err) throw err;
        var database = JSON.parse(data);
        if (database.hasOwnProperty("members")) { // check that database is initialized
            var result = database.members.find(element => {
                return element.phone == phoneNum;
            });
            console.log("lookup by phone returned:");
            console.log(result);
            if (result == undefined) {
                res.send("not found")
            } else { res.send(result.firstName) }
        } else { // if database is not initialized
            console.log("Database is empty. Restore db.json from backup and restart the server.")
            res.send("Database is empty. Restore db.json from backup and restart the server.")
        }
    })
    // res.send(JSON.parse(phoneNum));
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + "/frontend/signup/signup.html");
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + "/frontend/admin/admin.html");
})


// Socket.io
io.on('connection', function(socket) {
    console.log('a user connected');
    socket.on('phone lookup', function(phoneNumberOnly) {
        console.log("socket received " + phoneNumberOnly);
        fs.readFile("db.json", (err, data) => {
            if (err) throw err;
            var database = JSON.parse(data);
            if (database.hasOwnProperty("members")) { // check that database is initialized
                var result = database.members.find(element => {
                    return element.phone == phoneNumberOnly;
                });
                console.log("lookup by phone returned:");
                console.log(result);
                if (result == undefined) {
                    io.emit("user not found", "not found");
                } else { io.emit("user found", result) }
            } else { // if database is not initialized
                console.log("Database is empty. Restore db.json from backup and restart the server.")
            }
        })
    })
    // add to visits.json
    socket.on('save visit', function(count, userID, researchProduction, personalProfessional) {
        count = parseInt(count, 10);
        console.log("accompanied by " + count);
        var now = new Date();
        var shortDate = now.toJSON().substring(0, 10);
        // var shortDate = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
        console.log("short date is " + shortDate);
        // TKTKTKTKTKTKTK 
        // Update user database
        fs.readFile("db.json", (err, data) => {
            if (err) throw err;
            var db = JSON.parse(data);
            if (db.hasOwnProperty("members")) {
                var user = db.members.find(element => {
                    return element.userID == userID;
                })
                if (user == undefined) { // if the user isn't found (shouldn't happen as the user has already been identified by this point)
                    console.log("Wasn't able to update the user's Visits property.")
                } else { // if the user is found 
                    user.visits.push(shortDate); // add current short date to the user's visits 
                    fs.writeFile("db.json", JSON.stringify(db), err => { // overwrite database db
                        if (err) throw err;
                    })
                }
            } else {
                console.log("User database is empty. Restore db.json from backup and restart the server.")
            }
        })
        // TKTKTKTKTKTKT
        //Update visits database
        fs.readFile("visits.json", (err, data) => { // find today in visits.json
            if (err) throw err;
            var db = JSON.parse(data);
            if (db.hasOwnProperty("visits")) { // check that database is initialized
                var today = db.visits.find(element => {
                    return element.date == shortDate;
                });
                if (today == undefined) { // if no such date exists yet in visits.json, create it and add the new visitor + party
                    var newVisit = {
                        "date": shortDate,
                        "numVisitors": (count + 1),
                        "visitorList": [{
                            "user": userID,
                            "time": now,
                            "accompanied": count,
                            "researchProduction": researchProduction,
                            "personalProfessional": personalProfessional
                        }]
                    }
                    db.visits.push(newVisit); // push new date and visit to the visits key
                    fs.writeFile("visits.json", JSON.stringify(db), err => {
                        if (err) throw err;
                    });
                } else { // if the date already exists in visits.json
                    var newVisit = { // create new visit entry
                        "user": userID,
                        "time": now,
                        "accompanied": count,
                        "researchProduction": researchProduction,
                        "personalProfessional": personalProfessional
                    }
                    today.numVisitors = today.numVisitors + (count + 1); // add visitors to day
                    today.visitorList.push(newVisit); // add visitor details to day
                    fs.writeFile("visits.json", JSON.stringify(db), err => { // write updated entries to visits.json
                        if (err) throw err;
                    });
                }
            } else {
                console.log("Visits database is empty. Restore visits.json from backup and restart the server.")
            }
        });
    });

    //Generate Visits CSV
    socket.on("generate visits csv", function() {
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

            //write file to server root directory
            // fs.writeFile(fileName, CSV, err => {
            //     if (err) throw err;
            // });

            //send CSV to client
            io.emit("visits csv data", CSV, fileName);
        }
    });

    // Generate Anon CSV
    socket.on("generate anon csv", function() {
        var path = require('path'); // node module for working with directory and file paths
        const fs = require('fs'); // node module for working with the filesystem

        // 1. Fetch data from disk
        var anonDB = null;
        var anon = null;
        var rowCount = 0;
        var anonArray = [];

        // read anon.json
        fs.readFile('anonPecDb.json', processAnonDB); // read database, callback gets passed err and data
        function processAnonDB(err, data) {
            if (err) throw err; // handles readFile error
            anonDB = JSON.parse(data);
            anon = anonDB.anonData;
            createVisitsTable();
        }

        // 2. Combine information from two databases into a single table
        function createVisitsTable() {
            // Create a first element in the array, which contains the column names as values
            var header = {
                dateCreated: "Date d'abonnement",
                gender: "Genre",
                maritalStatus: "Status marital",
                headOfHousehold: "Chef de famille",
                origin: "Origine",
                schoolLevel: "Niveau de scolarite",
                workStatus: "Status de travail",
                annualRevenue: "Revenue annuel",
                residence: "Type de Residence",
                activityAtPEC: "Fab Lab"
            };
            anonArray.push(header);
            for (var i = 0; i < anon.length; i++) {
                // Prepare day of week
                var rawDate = anon[i].dateCreated.split('-');
                var creationDate = new Date(rawDate[0], rawDate[1], rawDate[2]);
                var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                var dayOfWeek = weekdays[creationDate.getDay()];
                // Create row object representing one sign-in to Frenzone
                var row = {
                    dateCreated: anon[i].dateCreated,
                    gender: anon[i].gender,
                    maritalStatus: anon[i].maritalStatus,
                    headOfHousehold: anon[i].headOfHousehold,
                    origin: anon[i].origin,
                    schoolLevel: anon[i].schoolLevel,
                    workStatus: anon[i].workStatus,
                    annualRevenue: anon[i].annualRevenue,
                    residence: anon[i].residence,
                    activityAtPEC: anon[i].activityAtPEC
                }
                anonArray.push(row);
            }

            // 3. Convert table to CSV
            var now = new Date();
            var shortDate = now.toJSON().substring(0, 10);
            convertJSONtoCSV(anonArray, shortDate);
        }


        function convertJSONtoCSV(JSONData, ReportTitle) {
            //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
            var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
            var CSV = '';

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
            var fileName = "FabLab Donnees Anonymes ";
            //this will remove the blank-spaces from the title and replace it with an underscore
            fileName += ReportTitle.replace(/ /g, "_");
            fileName += ".csv";

            //write file to server root directory
            // fs.writeFile(fileName, CSV, err => {
            //     if (err) throw err;
            // });

            // send CSV to client
            io.emit("visits csv data", CSV, fileName);
        }
    })

    // Disconnect
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});