const express = require('express'); // node module that routes http requests
const app = express(); // initialized express 
var http = require('http').Server(app);
var path = require('path'); // node module for working with directory and file paths
const fs = require('fs'); // node module for working with the filesystem
var bodyParser = require('body-parser'); // node module middleware for parsing incoming requests before handing off to other server-side functions 

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static("frontend")); // serve index.html, style.css, index.js, and other files from the path passed as a string

http.listen(8080, function() { // serve content to localhost:8080
  console.log('listening on *:8080');
});


// Handle HTTP POST request to save user data
// tutorial about handling POST requests https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
// POST http://localhost:8080/api/users
// parameters sent with 
app.post('/saveUser', function(req, res) {
  // TKTK 
  var data = req.body[0]; // do not need to JSON.parse
  var firstName = data.firstName;
	res.send("got user " + data.firstName);
});


// app.get('/', function(req, res){
//   res.sendFile(path.join(__dirname + "/frontend/index.html"));
// });


// on app.post
// when the frontend posts a new user


// Asynchronous read
fs.readFile('testTextFile.txt', function(err, data) {
  if (err) {
    return console.error(err);
  }
  console.log("Asynchronous read: " + data.toString());
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


// route with GET
app.get('/api/users', function(req, res) {
  var user_id = req.param('id');
  var token = req.param('token');
  var geo = req.param('geo');

  res.send(user_id + ' ' + token + ' ' + geo);
});