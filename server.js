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
        res.status(200).send({ message: "Success, wrote user to database.", redirect: "/success" }); // Send successful response and redirect to client
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
    socket.on('accompanying count', function(count, userID) {
        count = parseInt(count, 10);
        console.log("accompanied by " + count);
        var now = new Date();
        var shortDate = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
        console.log("short date is " + shortDate);
        // TKTKTKTKTKTKTK
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
                            "accompanied": count
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
                        "accompanied": count
                    }
                    today.numVisitors = today.numVisitors + (count + 1); // add visitors to day
                    today.visitorList.push(newVisit); // add visitor details to day
                    fs.writeFile("visits.json", JSON.stringify(db), err => { // write updated entries to visits.json
                        if (err) throw err;
                    });
                }
            } else {
                console.log("Database is empty. Restore visits.json from backup and restart the server.")
            }
        });
    });
    // Disconnect
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});





// Write file
// fs.open('testTextFile.txt', 'w', function (err, file) {
//   if (err) throw err;
//   console.log('Saved!');
// }); 

// take request property
// parameter middleware that will run before the next routes
app.param('name', function(req, res, next, name) {

    // check if the user with that name exists
    // do some validations
    // add -dude to the name
    var modified = name + '-dude';

    // save name to the request
    req.name = modified;

    next();
});

// http://localhost:8080/api/users/chris
app.get('/api/users/:name', function(req, res) {
    // the user was found and is available in req.user
    res.send('What is up ' + req.name + '!');
});


/*
var validate = function(req, res, next) { // validate sign-up data conforms to standards

// Express Validator i never figured it out. Here lies he first jumbled attempt cribbed in part from the express-validator get starting and the mozilla explainer
        [body('firstName').isLength({ min: 1 }).withMessage('First Name empty'),
            body('email').isEmail()
        ]

        // var newUser = res.locals.newUser;

        , (req, res, next) => {
            // Extract the validation errors from a request.
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                // There are errors. Render form again with sanitized values/errors messages.
                // Error messages can be returned in an array using `errors.array()`.
                return res.status(422).json({ errors: errors.array() });
            } else {
                // Data from form is valid.
            }
        };
  next()
};

var verify = function(req, res, next) {
    // Load database from disk
    var db = null; // Once read and parsed, this will be the database object
    fs.readFile('database.json', function(err, data) { // Asynchronous read database JSON file server disk
        if (err) {
            return console.error(err);
        }
        db = JSON.parse(data); // parse JSON into javascript object
    });

    // check if user is already in the database

    // if user is already in database respond negative
    // else add to database
    // console.log(db);
    res.locals.status = "written";
    // res.locals.db = db;
    // write anon data to database
    var anonData = res.locals.anonData;
    next();
}

*/

// // route with GET
// app.get('/api/users', function(req, res) {
//   var user_id = req.param('id');
//   var token = req.param('token');
//   var geo = req.param('geo');

//   res.send(user_id + ' ' + token + ' ' + geo);
// });


// How to send a file when a request hits a given path. This is insufficient for serving the main page because it only serves the one file, without the accompanying index.js and style.css
app.get('/xyz', function(req, res) {
    res.send({ "user": "raph", "height": "6" });
});