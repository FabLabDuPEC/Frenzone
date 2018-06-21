"use strict";

const express = require('express'); // node module that routes http requests
const app = express(); // initialized express 
var http = require('http').Server(app);
var path = require('path'); // node module for working with directory and file paths
const fs = require('fs'); // node module for working with the filesystem
var bodyParser = require('body-parser'); // node module middleware for parsing incoming requests before handing off to other server-side functions 
const { body, validationResult } = require('express-validator/check');

app.use(bodyParser.json()); // support json encoded bodies
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
    next()
};
var respond = function(req, res) {
    var newUser = res.locals.newUser;
    var anonData = res.locals.anonData;
    /// TKTKTK remove all the ifs and just return based on whether createUser succeeds
    if (createUser(newUser == "success")) {
        // TKTK send response to client : new user created
        res.send({"status": "success"});
    } else {
        //TKTK send response to client: failed 
        res.send({"status": "failed"});
    }
}

// Create user and write to database
//TKTKTK assign all properties of new user to an object that gets created
function createUser(newUser) {
    fs.readFile('database.json', verify); // callback gets passed err and data

    function verify(err, data) {
        if (err) throw err;
        var database = JSON.parse(data);
        console.log(database);
        var userCount = database.numberOfUsers;
        console.log("Verify: number of users: " + userCount);
        
        var IDinDB = function(element) { // function run on every element
            return element.userID == userCount + 1;
        };
        if (database.members.some(IDinDB)) { // return true as soon as any matching element is found
            throw Error("New User ID # already in Database. Something is funky with the server-side code!");
            res.send(newUser.firstName + " " + newUser.lastName + " already in the database.");
        }
        
        var telephoneInDB = function(element) { // function run on every element
            return element.telephone == telephone;
        };
        if (database.members.some(telephoneInDB)) {
            throw Error("New user's telephone # already in database.")
            res.send(newUser.telephone + " already in the database.");
            // return "telephone duplicate";
        }
       
        write(database, userCount);
    };

    function write(database, userCount) {
        var newUser = { "userID": userCount + 1, "name": name, "color": color, "telephone": telephone };
        database.numberOfUsers++; // increment user count in database
        database.members.push(newUser); // add new user to database
        fs.writeFile("db.json", JSON.stringify(database), err => { // write database to disk
            if (err) throw err;
        });
        console.log("Wrote " + newUser.name + " to database");
        return ("success");
    };
}



app.post('/saveUser', [receive, respond]); // array of functions that sequentially handle the request 









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