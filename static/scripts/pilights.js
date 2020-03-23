var socket = io(); //load socket.io-client and connect to the host that serves the page
var speed, light;
window.addEventListener("load", function(){ //when page loads
    light = document.getElementById("light");
    light.addEventListener("change", function() { //add event listener for when checkbox changes
        if(this.checked){
            socket.emit("activate",null);
        }else{
            socket.emit("deactivate",null);
        }
    });
    speed = document.getElementById("speed");
    speed.oninput = function(){
        socket.emit('setspeed',this.value);
    }
    socket.emit("state",null);
});


socket.on("status",function(data){
    //document.getElementById("statusval").value = data?"Activated":"Decactivated";
});
socket.on("activated",function(data){
    document.getElementById("light").checked=true;
    speed.value = data;
    //document.getElementById("statusval").value = "Activated";
    //document.getElementById("speedval").value = data;
});
socket.on("deactivated",function(data){
    document.getElementById("light").checked=false;
    //document.getElementById("statusval").value = "Decactivated";
});
socket.on("state",function(data){
    //document.getElementById("stateval").value = data;
    var interval=500;
    if (speed!=null){
        interval = speed.value;
    }
    showState(data)
    setTimeout(getState,interval);
});

function getState(){
    socket.emit("state",null);
}

function showState(data){
    var lights = document.getElementsByName("lights");
    for(i=0;i<lights.length;i++){
        if(i>=data.length){
            lights[i].style.display="none";
        }else if (data[i]=="0"){
            lights[i].style.display="inline-block";
            lights[i].className="led green";
        }else{
            lights[i].style.display="inline-block";
            lights[i].className="led red";
        }
    }
}