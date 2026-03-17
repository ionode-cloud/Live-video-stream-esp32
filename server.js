const express = require("express");
const app = express();

let clients = [];

/* HOME PAGE */
app.get("/", (req, res) => {

res.send(`
<!DOCTYPE html>
<html>
<head>
<title>ESP32 Live Camera</title>

<style>
body{
background:#111;
color:white;
font-family:Arial;
text-align:center;
}

img{
width:80%;
max-width:800px;
border-radius:10px;
display:none;
}

button{
padding:10px 20px;
margin:10px;
font-size:16px;
border:none;
border-radius:5px;
cursor:pointer;
}

.start{ background:green; color:white; }
.stop{ background:red; color:white; }

</style>
</head>

<body>

<h2>ESP32 Public Live Stream</h2>

<button class="start" onclick="startStream()">Start</button>
<button class="stop" onclick="stopStream()">Stop</button>

<br><br>

<img id="video">

<script>
let video = document.getElementById("video");

function startStream(){
    video.style.display = "block";
    video.src = "/stream";   // start streaming
}

function stopStream(){
    video.src = "";          // stop streaming
    video.style.display = "none";
}
</script>

</body>
</html>
`);

});


/* STREAM ENDPOINT */
app.get("/stream", (req, res) => {

res.writeHead(200, {
"Content-Type": "multipart/x-mixed-replace; boundary=frame",
"Cache-Control": "no-cache",
"Connection": "keep-alive",
"Pragma": "no-cache"
});

clients.push(res);

console.log("Viewer connected:", clients.length);

req.on("close", () => {

clients = clients.filter(c => c !== res);

console.log("Viewer disconnected:", clients.length);

});

});


/* FRAME UPLOAD FROM ESP32 */
app.post("/upload", (req, res) => {

let frame = [];

req.on("data", chunk => {
frame.push(chunk);
});

req.on("end", () => {

const image = Buffer.concat(frame);

for (const client of clients) {

client.write("--frame\r\n");
client.write("Content-Type: image/jpeg\r\n");
client.write("Content-Length: " + image.length + "\r\n\r\n");
client.write(image);
client.write("\\r\\n");
}

res.end("OK");

});

});


/* SERVER START */
const PORT = 3000;

app.listen(PORT, () => {
console.log("Server running at http://localhost:" + PORT);
});