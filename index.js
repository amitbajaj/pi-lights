const PORT = process.env.PORT || 5000
var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)

http.listen(PORT); //listen to port (either the system or local 5000)

function handler (req, res) { //create server
  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from index.html
    return res.end();
  });
}

io.sockets.on('connection', function (socket) {// WebSocket Connection
    var lightvalue = 0; //static variable for current status
    socket.on('light', function(data) { //get light switch status from client
      lightvalue = data;
      if (lightvalue>=10) {
        //console.log(1); //turn LED on or off, for now we will just show it in console.log
        lightvalue = -1;
      }
      socket.emit("light",lightvalue+1);
    });
  });