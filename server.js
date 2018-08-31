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

    // Disconnect
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});