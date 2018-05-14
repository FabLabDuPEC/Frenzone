const express = require('express');
const app = express();
var http = require('http').Server(app);
var path = require('path');

app.use(express.static("frontend"));

// app.get('/', function(req, res){
//   res.sendFile(path.join(__dirname + "/frontend/index.html"));
// });

http.listen(8080, function(){
  console.log('listening on *:8080');
});
    