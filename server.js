"use strict";

const express = require('express'); // node module that routes http requests
const app = express(); // initialized express 
var http = require('http').Server(app);
var path = require('path'); // node module for working with directory and file paths
const fs = require('fs'); // node module for working with the filesystem
var bodyParser = require('body-parser'); // node module middleware for parsing incoming requests before handing off to other server-side functions 
const uuidv4 = require('uuid/v4'); // node modele for generating non colliding ids
const { body, validationResult } = require('express-validator/check');
var io = require('socket.io')(http);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.text()); // support text encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static("frontend")); // serve index.html, style.css, index.js, and other files from the path passed as a string

http.listen(8080, "127.0.0.1", function() { // serve content to localhost:8080
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
            console.log("adding new user to anondb");
            anondb.anonData.push(res.locals.anonData)
            console.log("shuffling anondb");
            shuffleArray(anondb.anonData);
            console.log("writing anondb to disk");
            fs.writeFile("anonPecDb.json", JSON.stringify(anondb), err => {
                if (err) throw err;
            });
        });
        res.status(200).send({ message: "Success, wrote user to database.", redirect: "/login" }); // Send successful response and redirect to client
    };
};

//Shuffle code for shuffling anon array https://javascript.info/task/shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

function newShortDate() {
    var now = new Date();
    return now.toJSON().substring(0, 10);
}

// EXPRESS
app.post('/saveUser', [receive, respond]); // array of functions that sequentially handle the request 

app.get('/success', (req, res) =>
    res.send("success placeholder route"))

app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/frontend/login/login.html");
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + "/frontend/signup/signup.html");
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + "/frontend/admin/admin.html");
})

app.get('/bigscreen', (req, res) => {
    res.sendFile(__dirname + "/frontend/bigScreen/index.html")
})

// SOCIAL 
app.get('/capture1', (req, res) => {
    res.sendFile(__dirname + "/frontend/social/sandbox/1-capture-to-canvas/index.html");
});

app.get('/capture2', (req, res) => {
    res.sendFile(__dirname + "/frontend/social/sandbox/2-photo-grid/index.html");
});

app.get('/capture3', (req, res) => {
    res.sendFile(__dirname + "/frontend/social/sandbox/3-capture-to-file/index.html");
});

app.get('/capture4', (req, res) => {
    res.sendFile(__dirname + "/frontend/social/sandbox/4-gifshot/index.html");
});

app.get('/social/post', (req, res) => {
    res.sendFile(__dirname + "/frontend/social/")
});


// Old Express approach to handling user lookup, deprecated in favor of socket.io
/*
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
*/

// Socket.io
io.on('connection', function(socket) {
    console.log('client connected');
    //LOGIN 
    socket.on('phone lookup', function(phoneNumberOnly) {
        fs.readFile("db.json", (err, data) => {
            if (err) throw err;
            var database = JSON.parse(data);
            if (database.hasOwnProperty("members")) { // check that database is initialized
                var result = database.members.find(element => {
                    return element.phone == phoneNumberOnly;
                });
                if (result == undefined) {
                    io.emit("user not found", "not found");
                } else {
                    // check that person has not already logged in
                    var lastLoginDate = result.visits[(result.visits.length - 1)];
                    var today = newShortDate();
                    if (lastLoginDate === today) {
                        io.emit("user found", result, false) // This user has already logged in once today.
                    } else {
                        io.emit("user found", result, true); // This is the first log in today. Send user data to client.
                    }
                }
            } else { // if database is not initialized
                console.log("Database is empty. Restore db.json from backup and restart the server.")
            }
        })
    })
    // add to visits.json
    socket.on('save visit', saveVisit);

    function saveVisit(count, userID, researchProduction, personalProfessional) {
        count = parseInt(count, 10);
        console.log("accompanied by " + count);
        var now = new Date();
        var shortDate = newShortDate();
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
            sendRefreshedStatsToAdminClient();
            drawToBigScreen();
        });
    }

    ////////// BIG SCREEN ////////////
    function drawToBigScreen() {
        console.log("draw to big screen");
        io.emit("big screen login event");
    }

    /////////// ADMIN /////////////////////////////////
    // add unregistered visitors to visits.json
    socket.on('save unregistered visit', function(count) {
        var userId = -1;
        count = parseInt(count, 10);
        var now = new Date();
        var shortDate = newShortDate();
        // var shortDate = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
        console.log("short date is " + shortDate);
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
                        "numVisitors": count,
                        "visitorList": [{
                            "user": -1,
                            "time": now,
                            "accompanied": count,
                            "researchProduction": 0,
                            "personalProfessional": 0
                        }]
                    }
                    db.visits.push(newVisit); // push new date and visit to the visits key
                    fs.writeFile("visits.json", JSON.stringify(db), err => {
                        if (err) throw err;
                    });
                } else { // if the date already exists in visits.json
                    var newVisit = { // create new visit entry
                        "user": -1,
                        "time": now,
                        "accompanied": count,
                        "researchProduction": 0,
                        "personalProfessional": 0
                    }
                    today.numVisitors = today.numVisitors + count; // add visitors to day
                    today.visitorList.push(newVisit); // add visitor details to day
                    fs.writeFile("visits.json", JSON.stringify(db), err => { // write updated entries to visits.json
                        if (err) throw err;
                    });
                    socket.emit("unregistered visits saved", count); // send success message to client
                }
                sendRefreshedStatsToAdminClient();
            } else {
                console.log("Visits database is empty. Restore visits.json from backup and restart the server.")
            }
        });
    });
    // Send member list to client so they can add visits by user
    socket.on('load member list', () => {
        fs.readFile("db.json", (err, data) => {
            if (err) throw err;
            var parsedDb = JSON.parse(data);
            var members = parsedDb.members;
            // Create list of members with user IDs
            var membersList = [];
            for (var i = 0; i < members.length; i++) {
                var member = {
                    "name": members[i].firstName + " " + members[i].lastName,
                    "userID": members[i].userID
                }
                membersList.push(member);
            };
            membersList.sort(function(a, b) {
                var textA = a.name.toUpperCase();
                var textB = b.name.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });
            socket.emit('members list', membersList);
        });
    });

    // Save member visit from Admin interface, if they forgot to log in
    //TKTKTKT
    socket.on('save registered visit', function(userID, accompanyingCount) {
        saveVisit(accompanyingCount, userID, 50, 50);
        console.log(accompanyingCount, userID, 50, 50);
    });

    //  When client requests stats refresh
    socket.on('refresh stats', () => {
        sendRefreshedStatsToAdminClient();
    });

    // Send today's visit stats to client
    function sendRefreshedStatsToAdminClient() {
        // open visits db
        fs.readFile("visits.json", (err, unparsedData) => {
            if (err) throw err;
            var visits = JSON.parse(unparsedData).visits;
            fs.readFile("db.json", (err, unparsedData) => {
                if (err) throw err;
                var members = JSON.parse(unparsedData).members;
                // if last element of array is today
                var today = newShortDate();
                var ultimateElement = visits.pop();
                if (ultimateElement && ultimateElement.date === today) {
                    // count number of registered and unregistered visitors
                    var registeredVisitors = 0;
                    var unregisteredVisitors = 0;
                    var researchProduction = 0;
                    var personalProfessional = 0;
                    for (var i = 0; i < ultimateElement.visitorList.length; i++) {
                        if (ultimateElement.visitorList[i].user >= 0) { // if the visitor is registered
                            registeredVisitors++;
                            unregisteredVisitors = unregisteredVisitors + ultimateElement.visitorList[i].accompanied;
                            researchProduction = researchProduction + ultimateElement.visitorList[i].researchProduction;
                            personalProfessional = personalProfessional + ultimateElement.visitorList[i].personalProfessional;
                        } else { // if the visitor is unregistered
                            unregisteredVisitors = unregisteredVisitors + ultimateElement.visitorList[i].accompanied;
                        }
                    }
                    // Create list of today's logged visits: Member name, Accompany count, and time they logged in
                    var loginsToday = []; // People who visited today
                    for (var i = 0; i < ultimateElement.visitorList.length; i++) {
                        if (ultimateElement.visitorList[i].user >= 0) { // If the visitor is registered
                            var userData = members[ultimateElement.visitorList[i].user - 1];
                            var visitor = {
                                "firstName": userData.firstName,
                                "lastName": userData.lastName,
                                "email": userData.email,
                                "phone": userData.phone,
                                "time": ultimateElement.visitorList[i].time,
                                "accompanied": ultimateElement.visitorList[i].accompanied,
                                "userID": userData.userID
                            };
                            // Check if user owes membership dues, add to visitor listing if so
                            let lastPaidMembership = new Date(userData.lastPaidMembership);
                            let difference = (new Date(newShortDate()) - lastPaidMembership) / (1000 * 60 * 60 * 24);
                            if (difference > 365) {
                                visitor.lastPaidMembership = difference;
                            }
                            loginsToday.push(visitor);
                        } else { // If the visitor is unregistered
                            var visitor = {
                                "firstName": "Unregistered",
                                "lastName": "",
                                "time": ultimateElement.visitorList[i].time,
                                "accompanied": ultimateElement.visitorList[i].accompanied
                            };
                            loginsToday.push(visitor);
                        }
                    }
                    var stats = { // create a stats object and send it to the client
                        "date": today,
                        "registeredVisitors": registeredVisitors,
                        "unregisteredVisitors": unregisteredVisitors,
                        "researchProduction": Math.floor(researchProduction / registeredVisitors),
                        "personalProfessional": Math.floor(personalProfessional / registeredVisitors),
                        "loginsToday": loginsToday,
                        "status": true // status: there have been visitors
                    }
                } else { // send no visits yet today to client
                    var stats = {
                        "date": today,
                        "status": false // status: there have been no visitors yet today
                    }
                }
                socket.emit("new stats", stats); // send today's stats to the clients
            })
        });
    }

    // Member has paid new membership 
    socket.on("admin membership paid", (userID) => {
        fs.readFile("db.json", (err, data) => {
            if (err) throw err;
            var usersDB = JSON.parse(data);
            var members = usersDB.members;
            console.log("member " + userID + " last paid membership updated to today, " + newShortDate());
            members[userID - 1].lastPaidMembership = newShortDate(); // update user data
            fs.writeFile("db.json", JSON.stringify(usersDB), err => { // write database to disk
                if (err) throw err;
            });
        });
    });

    // Generate Members CSV
    socket.on("generate members CSV", () => {
        // 1. Fetch data from disk 
        fs.readFile("db.json", processUsersDB);

        function processUsersDB(err, data) {
            if (err) throw err;
            var usersDB = JSON.parse(data);
            var members = usersDB.members;
            createMembersTable(members);
        }

        // 2. Create table object
        function createMembersTable(members) {
            var membersTable = []; // Create members table
            // Create a first element in the array, which contains the column names as values
            var header = {
                userID: "User ID",
                firstName: "Prenom",
                lastName: "Nom de famille",
                phone: "Telephone",
                email: "Adresse courriel",
                postalCode: "Code postal",
                visitCount: "Visites",
                skills: "Competences",
                hadAlreadyVisitedALab: "Avait deja visite un lab",
                dateCreated: "Date cree",
                memberType: "Type de membre"
            };
            membersTable.push(header);

            for (var i = 0; i < members.length; i++) {
                var user = members[i];
                var row = {
                    userID: user.userID,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    email: user.email,
                    postalCode: user.postalCode,
                    visitCount: user.visits.length,
                    skills: user.skills,
                    hadAlreadyVisitedALab: user.hadAlreadyVisitedALab,
                    dateCreated: user.dateCreated,
                    memberType: user.memberType
                }
                membersTable.push(row);
            }
            // 3. Convert table to CSV
            var now = new Date();
            var shortDate = now.toJSON().substring(0, 10);
            convertJSONtoCSV(membersTable, shortDate);
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
            var fileName = "FabLab Rapport De Membres ";
            //this will remove the blank-spaces from the title and replace it with an underscore
            fileName += ReportTitle.replace(/ /g, "_");
            fileName += ".csv";

            //write file to server root directory
            // fs.writeFile(fileName, CSV, err => {
            //     if (err) throw err;
            // });

            //send CSV to client
            socket.emit("members csv data", CSV, fileName);
        }
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
                postalCode: "Code postal",
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
                    var visitDate = new Date(visits[i].date); // create Date object from archive
                    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]; // create weekday array that corresponds to Date.getDay()
                    var dayOfWeek = weekdays[visitDate.getDay()]; // derive day of week
                    // Prepare time of day
                    var rawTime = new Date(visits[i].visitorList[j].time);
                    var timeOfDay = rawTime.getHours() + ":" + rawTime.getMinutes();
                    // Check if this is a real user or unregistered visitors logged with the admin console
                    if (visits[i].visitorList[j].user != -1) { // If this visit is a regular user
                        //prepare data from users database
                        var user = users[(visits[i].visitorList[j].user - 1)];
                        // Create row object representing one sign-in to Frenzone
                        var row = {
                            date: visits[i].date,
                            userID: visits[i].visitorList[j].user,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            visitorCount: (visits[i].visitorList[j].accompanied + 1),
                            postalCode: user.postalCode,
                            researchProduction: visits[i].visitorList[j].researchProduction,
                            personalProfessional: visits[i].visitorList[j].personalProfessional,
                            dayOfWeek: dayOfWeek,
                            timeOfDay: timeOfDay,
                            memberType: user.memberType
                        }
                        visitsArray.push(row);
                    } else { // Else this visit was added by admin to account for unregistered users
                        var row = {
                            date: visits[i].date,
                            userID: -1,
                            firstName: "",
                            lastName: "",
                            visitorCount: visits[i].visitorList[j].accompanied,
                            postalCode: "",
                            researchProduction: "",
                            personalProfessional: "",
                            dayOfWeek: dayOfWeek,
                            timeOfDay: timeOfDay,
                            memberType: ""
                        }
                        visitsArray.push(row);
                    }
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
            socket.emit("visits csv data", CSV, fileName);
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
            socket.emit("visits csv data", CSV, fileName);
        }
    });

    /////////// Social /////////////////////////////
    socket.on("post gif", function(postCandidate) {
        //postCandidate contains URI, title, and skills
        fs.readFile("social.json", (err, unparsedData) => {
            if (err) throw err;
            var data = JSON.parse(unparsedData);
            if (data.hasOwnProperty("posts")) { // Verify that posts property is initialized in database
                var posts = data.posts;
                var postsSortedByUser = data.postsSortedByUser;
                // Determine postId of next post
                var postNumber = posts.length;
                // TKTKTK fetch current userId
                var userId = 0;
                // Create unique ID for file
                var ID = uuidv4(); // Generate unique id
                var fileType = postCandidate.URI.substring(11, 14); // Extract filetype from URI
                var fileName = ID + "." + fileType;
                var directory = __dirname + "/blablab_resources/";
                // Save gif to a directory
                var image = postCandidate.URI.split(';base64,').pop(); // Remove metadata from URI, leaving only image data
                fs.writeFile((directory + fileName), image, { encoding: 'base64' }, function(err) {
                    if (err) throw err;
                    console.log('File created: ' + directory + fileName);
                });
                // Prepare post 
                var preparedPost = {
                    "postNumber": postNumber,
                    "postId": ID,
                    "fileName": fileName,
                    "fileType": fileType,
                    "dateCreated": new Date(),
                    "userId": userId,
                    "title": postCandidate.title,
                    "skills": postCandidate.skills,
                }
                posts.push(preparedPost) // Add preparedPost to posts array
                if (data.hasOwnProperty("postsSortedByUser")) { // Verify that postsSortedByUser property is initialized in database
                    // Prepare entry for postsSortedByUser array
                    var preparedPostsSortedByUser = null;
                    // Check if user is in postsSortedByUser 
                    if (postsSortedByUser[userId] != undefined) { // If this user is already present in the postsSortedByUser array
                        preparedPostsSortedByUser = postsSortedByUser[userId]; // Copy prior data from database
                        var newData = { "postNumber": postNumber, "postId": ID };
                        preparedPostsSortedByUser.postsByThisUserId.push(newData); // Add this post to the array postsByThisUserId
                    } else { // If user is not in postsSortedByUser, create their element
                        preparedPostsSortedByUser = {
                            "userId": userId,
                            "postsByThisUserId": [{ "postNumber": postNumber, "postId": ID }]
                        }
                    }
                    postsSortedByUser[userId] = preparedPostsSortedByUser; // Update PostsSortedByUser array
                    // TKTKTK sometimes social.json gets wiped out. this function should only execute if prior functions successfully created prepared material
                    fs.writeFile("social.json", JSON.stringify(data), err => { // write updated entry to social.json
                        if (err) throw err;
                    });
                }
            } else { console.log("Social.json is not initialized with any values. Maybe time to restore a backup.") }
        })
    });

    socket.on("request posts", function(quantity) {
        fs.readFile("social.json", (err, unparsedData) => {
                if (err) throw err;
                var data = JSON.parse(unparsedData);
                if (data.hasOwnProperty("posts")) {
                    var posts = data.posts;
                    var noMorePosts = false;
                    var emitArray = [];
                    for (var i = (posts.length - 1); i >= (posts.length - 1 - quantity) && i >= 0; i--) {
                        //TKTKTK Fetch username from db.json
                        var directory = __dirname + "/blablab_resources/";
                        // read the image file from disk
                        var newPost = getFile([(directory + posts[i].fileName), posts[i]])
                            .then(data => getBase64Image(data)) // Convert file on disk to base64 representation
                            .then(data => createPost(data)) // Package the base64 image and metadata into an object
                            .then(packagedPost => pushToArray(packagedPost)) // add post to emitarray
                            // .then(resolve => emitTheArray)
                            // .then(packagedPost => emitPost(packagedPost)) // Emit the new post object to the client 
                            .catch(error => console.log(error)); // Catch and log errors

                        //this is not yet working
                        // function emitTheArray() {
                        //     return new Promise((resolve, reject) => {
                        //         // if (emitArray.length > 2) {
                        //             console.log(emitArray);
                        //             console.log("emitting array");
                        //             resolve(io.emit('load post array', newPostsArray));
                        //         // } else { reject(new Error("could not emit array")) }
                        //     }
                        //     )
                        // }


                        function getFile(data) {
                            return new Promise((resolve, reject) => {
                                console.log("get file called");
                                var filePath = data[0];
                                var postMetadata = data[1];
                                fs.readFile(filePath, (err, file) => {
                                    if (err) throw err;
                                    if (file != null) {
                                        resolve([file, postMetadata]);
                                    } else { reject("getFile failed"); }
                                });
                            });
                        }

                        function getBase64Image(data) {
                            return new Promise((resolve, reject) => { // Create new promise that returns
                                console.log("getBase64Image called");
                                var file = data[0];
                                var postMetadata = data[1];
                                console.log(postMetadata);
                                // the async process
                                var buffer = new Buffer(file);
                                var base64Image = buffer.toString('base64'); // convert image to base64
                                if (base64Image) {
                                    console.log("Resolving base64Image" + base64Image.substring(0, 10));
                                    resolve([base64Image, postMetadata]);
                                } else {
                                    reject(Error("it didn't work"));
                                }
                            });
                        }

                        function createPost(data) {
                            return new Promise((resolve, reject) => {
                                console.log("createPost called");
                                var image = data[0];
                                var postMetadata = data[1];
                                // Get metadata
                                var packagedPost = {
                                    "title": postMetadata.title,
                                    "fileType": postMetadata.fileType,
                                    "skills": postMetadata.skills,
                                    "dateCreated": postMetadata.dateCreated.substring(0, 10),
                                    "image": image
                                }
                                if (packagedPost.image != null) {
                                    console.log("Resolving packaged post");
                                    console.log(packagedPost.title);
                                    resolve(packagedPost);
                                } else {
                                    reject(Error("createPost failed"))
                                }
                            })
                        }

                        function pushToArray(packagedPost) {
                            return new Promise((resolve, reject) => {
                                console.log("pushToArray called");
                                emitArray.push(packagedPost);
                            })
                        }

                    };

                    // function emitPost(newPost) { // emit post to client
                    //     console.log("emitPost called");
                    //     console.log(newPost.title);
                    //     // Send post to client
                    //     io.emit('load post', newPost, noMorePosts);
                    // }

                    function emitPostArray() { // emit post array to client.
                        console.log("emitPostArray called");
                        if (emitArray.length == quantity) {
                            socket.emit('load post array', newPostsArray);
                            resolve("emitted postArray");
                        } else {}
                    }
                };
            }

            // // If reached end of list, add boolean to emit
            // if (i === 0) {
            //     noMorePosts = true;
            // }
        );
    });

    // Disconnect
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});