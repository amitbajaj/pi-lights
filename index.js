const PORT = process.env.PORT || 5000
var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio; //require onoff module to interact with GPIO header
var R1 = new Gpio(26, 'out'); //use GPIO pin 26 for Relay 1, and specify that it is output
var R2 = new Gpio(19, 'out'); //use GPIO pin 19 for Relay 2, and specify that it is output
var R3 = new Gpio(13, 'out'); //use GPIO pin 13 for Relay 3, and specify that it is output
var R4 = new Gpio(6, 'out');  //use GPIO pin  6 for Relay 4, and specify that it is output

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
        socket.emit("toggle",1);
        R4.writeSync(0);
      }else if(lightvalue==5){
        R4.writeSync(1);
      }
      socket.emit("light",lightvalue+1);
    });
  });

var t = setInterval(blink,500);
var i = 1;
function blink(){
  if(i>=5) i=1;
  switch(i++){
    case 1:
      R1.writeSync(0);
      R2.writeSync(1);
      R3.writeSync(1);
      R4.writeSync(1);
      break;
    case 2:
      R1.writeSync(1);
      R2.writeSync(0);
      R3.writeSync(1);
      R4.writeSync(1);
      break;
    case 3:
      R1.writeSync(1);
      R2.writeSync(1);
      R3.writeSync(0);
      R4.writeSync(1);
      break;
    case 4:
      R1.writeSync(1);
      R2.writeSync(1);
      R3.writeSync(1);
      R4.writeSync(0);
      break;
  }
}