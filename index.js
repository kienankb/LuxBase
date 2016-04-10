var API_VERSION = 1;

var config = {
	"port" : 4242,
	"name" : "Home",
	"device" : "/dev/ttyACM0",
	"presets" : [
		["Off", [0, 0, 0]],
		["Incandescent Hi", [255, 60, 20]],
		["Incandescent Lo", [255, 60, 30]],
		["Full white", [255, 255, 255]]
	]
};

var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var serial = new SerialPort (config.device,
	{baudrate: 9600, parser: serialport.parsers.readline("\n")});

var colors = { "r" : 0, "g" : 0, "b" : 0 };
var servermode = "solid";

serial.on("open", function() {
	console.log('[INFO] Opening serial port...');
	serial.on('data', function(data) {
			if (data.trim() == "ok") {
			console.log("[INFO] Ready for requests.");
		}
		else {
			console.log("[ERROR] received unexpected serial data:");
		}
	});
});

http.listen(config.port, function() {
	console.log('[INFO] Server listening on *:' + config.port);
});

app.use(bodyParser.urlencoded({extended:true}));

app.get('/status/', function(req, res) {
	var status = {
		"version" : API_VERSION,
		"mode" : servermode,
		"colorsRGB" : [colors.r, colors.g, colors.b],
		"name" : config.name,
		"presets" : config.presets
	};
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(status));
	console.log("[INFO] Received status request");
});

app.post('/v1/update/', function(req, res) {
	reqmode = req.body.mode;
	if (reqmode == "jump") {
		servermode = "solid";
		console.log("[INFO] Jumping to " + "(" + req.body.r + ", " + req.body.g + ", " + req.body.b + ")");
		colors.r = req.body.r;
		colors.g = req.body.g;
		colors.b = req.body.b;
		sendColor(colors.r, colors.g, colors.b);
	}
	else if (reqmode == "fade") {
		servermode = "solid";
		console.log("[INFO] Fading to " + "[" + req.body.r + " " + req.body.g + " " + req.body.b + "]");
		var stepcount = 0;
		while (colors.r != req.body.r || colors.g != req.body.g || colors.b != req.body.b) {
			if (colors.r < req.body.r) {colors.r++;}
			if (colors.r > req.body.r) {colors.r--;}
			if (colors.g < req.body.g) {colors.g++;}
			if (colors.g > req.body.g) {colors.g--;}
			if (colors.b < req.body.b) {colors.b++;}
			if (colors.b > req.body.b) {colors.b--;}
			stepcount++;
			sendColor(colors.r, colors.g, colors.b);
		}
		console.log("[INFO] Fade took " + stepcount + " steps");
	}
	else if (mode == "pulse") {

	}
	else if (mode == "blink") {

	}
	else if (mode == "disco") {

	}
	res.end();
});

function sendColor(newR, newG, newB) {
	serial.write("$" + newR + "#" + newG + "#" + newB + "#", function(err, results) {
		if (err) { console.log("[ERROR] " + err + ": " + results); }
	});
}
