var Gpio = require('onoff').Gpio; //require onoff module to interact with GPIO header
var R = Array();
/*** 8 port */
R[0] = new Gpio(4, 'out');   //use GPIO pin  4 for Relay 1, and specify that it is output
R[1] = new Gpio(17, 'out');  //use GPIO pin 17 for Relay 2, and specify that it is output
R[2] = new Gpio(27, 'out');  //use GPIO pin 27 for Relay 3, and specify that it is output
R[3] = new Gpio(22, 'out');  //use GPIO pin 22 for Relay 4, and specify that it is output
R[4] = new Gpio(18, 'out');  //use GPIO pin 18 for Relay 5, and specify that it is output
R[5] = new Gpio(23, 'out');  //use GPIO pin 23 for Relay 6, and specify that it is output
R[6] = new Gpio(24, 'out');  //use GPIO pin 24 for Relay 7, and specify that it is output
R[7] = new Gpio(25, 'out');  //use GPIO pin 25 for Relay 8, and specify that it is output

const PORT = process.env.PORT || 5000;
const IDFILE = '.myid.dat'; //name of the file containing the UUID for instance
const http = require('http').createServer(handler); //require http server, and create server with function handler()
const fs = require('fs'); //require filesystem module
const io = require('socket.io')(http); //require socket.io module and pass the http object (server)
const uuidv5 = require('uuid/v5'); //require the UUID module to generate the unique UUID for this instance
const static = require('node-static'); //require the node-static module to server the static files 
const file = new static.Server('./static'); //serve static content from a specific folder only
const got = require('got');
const ONLINE_CHECK_INTEVAL = 1000; //millisecond after which to check the status from online URL
const MYDOMAIN = "https://bajajtech.in/lights"; // namespace for UUID and APPURL
var speed = 500; //Current interval between on and off sequences
var t; //the Interval Timer handle
var counter = 1; //Addition factor
var direction = 1; //addition direction (+1 to move forward, -1 to move backwards)
var switches = R.length; //Number of relays.
var isActive = false; //Status of relays
var myId = uuidv5(MYDOMAIN,uuidv5.URL); //generate a UUID at startup. If an existing UUID is present, we will use that otherwise we will use this and write it back to the ID file
fs.exists(__dirname+'/'+IDFILE,()=>{
  fs.readFile(__dirname + '/'+IDFILE, (err,data)=>{
      if(err){
          console.log("Error reading ID");
          http.close();
      }else{
          myId = data;
      }
  });
});
fs.writeFile(__dirname+'/'+IDFILE,myId,(err)=>{
  if(err){
      console.log("Unable to set the UUID\n"+err.message);
  }
});
const APPURL = MYDOMAIN+'/api.php?uuid='+escape(myId); //URL of the application on the internet

http.listen(PORT); //listen to port (either the system or local 5000)

function handler (req, res) { //create server
  if(req.url=="/api"){
    res.writeHead(200, {'Content-Type': 'text/json'}); //write HTML
    res.write("{'name':'api', 'description': 'The API uri will be used by the IoT devices'}"); //write data from index.html
    return res.end();
  }else if(req.url=='/stop'){
    http.close();
    process.exit();
  }else if(req.url=='/' || req.url==''){
    fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
      if (err) {
        res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
        return res.end("404 Not Found");
      }
      res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
      res.write(data); //write data from index.html
      return res.end();
    });  
  }else{
    file.serve(req,res);
  }
}

io.sockets.on('connection', function (socket) {// WebSocket Connection
    // var lightvalue = 0; //static variable for current status
    // socket.on('light', function(data) { //get light switch status from client
    //   lightvalue = data;
    //   if (lightvalue>=10) {
    //     //console.log(1); //turn LED on or off, for now we will just show it in console.log
    //     lightvalue = -1;
    //     socket.emit("toggle",1);
    //   }else if(lightvalue==5){
    //   }
    //   socket.emit("light",lightvalue+1);
    // });
    socket.on("status",function(data){
      socket.emit("status",isActive);
      socket.emit("speed",speed);
    });
    socket.on("activate", function(data){
      isActive = true;
      setTimeout(blink,speed);
      socket.emit("activated",speed);
    });
    socket.on("deactivate",function(data){
      switchoff();
      socket.emit("deactivated",null);
    });
    socket.on("setspeed",function(data){
      speed=parseInt(data);
    });
    socket.on("state", function(data){
      var state="";
      for(i=0;i<switches;i++){
        state+=""+R[i].readSync();
      }
      socket.emit("state",state);
      socket.emit("status",isActive);
      socket.emit("speed",speed);
    });
  });

function switchoff(){
  //console.log("Stopping the loop..."+counter);
  isActive = false;
  for(i=0;i<switches;i++){
    R[i].writeSync(0);
  }
}
function blink(){
  for(i=0;i<switches;i++){
    R[i].writeSync(counter-i-1==0?0:1);
  }
  if((counter+direction)>switches | counter+direction<1) direction*=-1;
  counter+=direction;
  if(isActive){
    //console.log("Looping...."+counter);
    setTimeout(blink,speed);
  }else{
    switchoff();
  }
}

function getOnlineStatus(){
  got(APPURL)
    .json()
    .then(response => {
      switch (response.status){
        case 'success':
          switch(response.action){
            case 'start':
              if(!isActive){
                isActive=true;
                blink();
              }
              break;
            case 'stop':
              isActive=false;
              break;
            case 'speed':
              speed=parseInt(response.value);
              break;
          }
          break;
        case 'fail':
          break;
      }
    })
    .catch(error => {
      console.log(error);
    });
  setTimeout(getOnlineStatus,ONLINE_CHECK_INTEVAL);  
}
setTimeout(getOnlineStatus,ONLINE_CHECK_INTEVAL);