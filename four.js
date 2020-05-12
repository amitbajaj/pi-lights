var Gpio = require('onoff').Gpio; //require onoff module to interact with GPIO header
var R = Array();
/*** 4 port */
R[0] = new Gpio(26, 'out'); //use GPIO pin 26 for Relay 1, and specify that it is output
R[1] = new Gpio(19, 'out'); //use GPIO pin 19 for Relay 2, and specify that it is output
R[2] = new Gpio(13, 'out'); //use GPIO pin 13 for Relay 3, and specify that it is output
R[3] = new Gpio(6, 'out');  //use GPIO pin  6 for Relay 4, and specify that it is output
const MYNAME = 'Four-Port-Relay';
const PORTS = 4;

const PORT = process.env.PORT || 5000;
const IDFILE = '.myid.dat'; //name of the file containing the UUID for instance
const http = require('http').createServer(handler); //require http server, and create server with function handler()
const https = require('https'); // required to send post requests to API Server
const fs = require('fs'); //require filesystem module
const io = require('socket.io')(http); //require socket.io module and pass the http object (server)
const {v4: uuidv4} = require('uuid'); //require the UUID module to generate the unique UUID for this instance
const static = require('node-static'); //require the node-static module to server the static files 
const file = new static.Server('./static'); //serve static content from a specific folder only
const got = require('got'); //got library for calling API calls
const FormData = require('form-data'); //form-data library for sending formdata in got API calls
const ONLINE_CHECK_INTERVAL = 1000; //millisecond after which to check the status from online URL
const MYDOMAIN = "https://bajajtech.in/lights"; // namespace for UUID and APPURL
var speed = 500; //Current interval between on and off sequences
var t; //the Interval Timer handle
var counter = 1; //Addition factor
var direction = 1; //addition direction (+1 to move forward, -1 to move backwards)
var switches = R.length; //Number of relays.
var isActive = false; //Status of relays
var myId = uuidv4().toString(); //generate a UUID at startup. If an existing UUID is present, we will use that otherwise we will use this and write it back to the ID file
console.log("My new Id is : "+myId)
fs.exists(__dirname+'/'+IDFILE,()=>{
  console.log("ID File exists!")
  fs.readFile(__dirname + '/'+IDFILE, (err,data)=>{
      if(err){
        console.log("Error reading ID");
        http.close();
      }else{
        console.log("ID File exists!")
        myId = data.toString();
      }
  });
});
console.log("My final Id is : "+myId)

fs.writeFile(__dirname+'/'+IDFILE,myId,(err)=>{
  if(err){
      console.log("Unable to set the UUID\n"+err.message);
  }
});
const APPURL = MYDOMAIN+'/api.php'; //URL of the application on the internet

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
  const data = JSON.stringify({
    name: MYNAME,
    uuid: myId,
    ports: PORTS
  });
  
  const options = {
    hostname: 'bajajtech.in',
    port: 443,
    path: '/lights/code/api.php',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  const req = https.request(options, (res) => {
    if(res.statusCode==200){
      res.on('data', (d) => {
        response = JSON.parse(d);
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
              case 'flip':
                iNum = parseInt(response.value)
                if(iNum>=0 && iNum<R.length){
                  if(R[iNum].readSync()==0){
                    R[iNum].writeSync(1);
                  }else{
                    R[iNum].writeSync(0);
                  }  
                }
                break;
            }
            break;
          case 'fail':
            break;
        }
      });
    }
    setTimeout(getOnlineStatus,ONLINE_CHECK_INTERVAL);  
  });
  
  req.on('error', (error) => {
    console.error(error);
  });
  
  req.write(data);
  req.end();  
}

setTimeout(getOnlineStatus,ONLINE_CHECK_INTERVAL);
