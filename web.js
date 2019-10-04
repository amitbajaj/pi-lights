const PORT = process.env.PORT || 5000;
const IDFILE = '.myid.dat'; //name of the file containing the UUID for instance
const APPURL = 'https://bajajtech.in/lights'; //URL of the application on the internet
var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var uuidv5 = require('uuid/v5'); //require the UUID module to generate the unique UUID for this instance
var webCall = require('request'); //require request module to get/set status on internet
var myId = uuidv5(APPURL,uuidv5.URL); //generate a UUID at startup. If an existing UUID is not present, we will use that otherwise we will use this and write it back to the ID file
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
        http.close();
    }
});

webCall(APPURL+'/api.php?uuid='+escape(myId), { json: true }, (err, res, body) => {
    if (err) {
        return console.log(err);
    }
    if (res.statusCode!=200){
        console.log(res.statusMessage);
    }else{
        console.log(body.uuid);
    }
});

http.listen(PORT); //listen to port (either the system or local 5000)

function handler (req, res) { //create server
  if(req.url=="/api"){
    res.writeHead(200, {'Content-Type': 'text/json'}); //write HTML
    res.write("{'name':'api', 'description': 'The API uri will be used by the IoT devices', 'uuid': '"+myId+"'}"); //write data from index.html
    return res.end();
  }else{
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
}
