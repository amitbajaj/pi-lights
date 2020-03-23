var socket = io(); //load socket.io-client and connect to the host that serves the page
window.addEventListener("load", function(){ //when page loads
    var lightbox = document.getElementById("light");
    lightbox.addEventListener("change", function() { //add event listener for when checkbox changes
        if(this.checked){
            socket.emit("activate",null);
        }else{
            socket.emit("deactivate",null);
        }
    });
    socket.emit("state",null);
});

var speed = document.getElementById("speed");
if (speed!=null){
    speed.oninput = function(){
        socket.emit('setspeed',this.value);
    }
}

socket.on("status",function(data){
    document.getElementById("statusval").value = data?"Activated":"Decactivated";
});
socket.on("activated",function(data){
    document.getElementById("statusval").value = "Activated";
    document.getElementById("speedval").value = data;
});
socket.on("deactivated",function(data){
    document.getElementById("statusval").value = "Decactivated";
});
socket.on("state",function(data){
    document.getElementById("stateval").value = data;
    showState(data)
    setTimeout(getState,500);
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