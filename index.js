var API_VERSION = 1;
var config = {																	// Customize these values to your liking.
    "port": 4242,																//	Port on which server runs
    "name": "Home",																//	Name displayed by server
    "device": "/dev/ttyACM0",													//	Path to Arduino
    "presets": [
        ["Off", [0, 0, 0]],
        ["Incandescent Hi", [255, 60, 20]],
        ["Incandescent Lo", [255, 60, 30]],
        ["Full white", [255, 255, 255]],
        ["Red", [255, 0, 0]],
        ["Green", [0, 255, 0]],
        ["Blue", [0, 0, 255]]
    ],
    "authrequired": false,														//	If true, change username and password
    "username": "Billy",														//	to whatever you'd like
    "password": "mypass"
};
var express = require('express');												// Initialization and crap
var app = express();
var http = require('http').Server(app);
var auth = require('basic-auth');
var bodyParser = require('body-parser');
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var serial = new SerialPort(config.device, { baudrate: 9600, parser: serialport.parsers.readline("\n") });
var colors = { "r": 0, "g": 0, "b": 0 };
var servermode = "solid";

app.use(bodyParser.urlencoded({ extended: true }));

function authorized(user) {														// Simple homebrew auth function to validate username & password
    if (config.authrequired) {
        if (user == undefined) { return false; }
        else { return (user.name == config.username && user.pass == config.password); }
    }
    else { return true; }
}

serial.on("open", function () {													// Initiate serial connection with Arduino and wait for ready signal
    console.log('[INFO] Opening serial port...');
    serial.on('data', function (data) {
        if (data.trim() == "ok") {
            console.log("[INFO] Ready for requests.");
        }
        else {
            console.log("[ERROR] received unexpected serial data:");
        }
    });
});

http.listen(config.port, function () {											// Spin up HTTP server
    console.log('[INFO] Server listening on *:' + config.port);
});

app.get('/status/', function (req, res) {										// Return an object with server status and presets
    var user = auth(req);
    if (authorized(user)) {
        var status = {
            "version": API_VERSION,
            "mode": servermode,
            "colorsRGB": [colors.r, colors.g, colors.b],
            "name": config.name,
            "presets": config.presets
        };
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(status));
        console.log("[INFO] Received status request");
    }
    else {																		// TODO: Verify this is properly error-ing out
        console.log("[INFO] Received unauthorized /status/ request");
        res.statusCode = 401;
        res.end("Authentication required");
    }
});

app.post('/v1/update/', function (req, res) {									// Post a new color/mode to the server to update the lights
    var user = auth(req);
    if (authorized(user)) {
        reqmode = req.body.mode;
        if (reqmode == "jump") {												// Instant color switch
            servermode = "solid";
            console.log("[INFO] Jumping to " + "(" + req.body.r + ", " + req.body.g + ", " + req.body.b + ")");
            colors.r = req.body.r;
            colors.g = req.body.g;
            colors.b = req.body.b;
            sendColor(colors.r, colors.g, colors.b);
        }
        else if (reqmode == "fade") {											// Fade over time
            servermode = "solid";												//	TODO: change increment for a faster fade?
            console.log("[INFO] Fading to " + "[" + req.body.r + " " + req.body.g + " " + req.body.b + "]");
            var stepcount = 0;
            while (colors.r != req.body.r || colors.g != req.body.g || colors.b != req.body.b) {
                if (colors.r < req.body.r) { colors.r++; }
                if (colors.r > req.body.r) { colors.r--; }
                if (colors.g < req.body.g) { colors.g++; }
                if (colors.g > req.body.g) { colors.g--; }
                if (colors.b < req.body.b) { colors.b++; }
                if (colors.b > req.body.b) { colors.b--; }
                stepcount++;
                sendColor(colors.r, colors.g, colors.b);
            }
            console.log("[INFO] Fade took " + stepcount + " steps");
        }
        else if (mode == "pulse") {
			// TODO: Implement mode, future API version
        }
        else if (mode == "blink") {
			// TODO: Implement mode, future API version
        }
        else if (mode == "disco") {
			// TODO: Implement mode, future API version
        }
        res.end();
    }
    else {
        console.log("[INFO] Received unauthorized /status/ request");
        res.statusCode = 401; // Is this working?
        res.end("Authentication required");
    }
});

function sendColor(newR, newG, newB) {													// Send a color to the Arduino and lights
    serial.write("$" + newR + "#" + newG + "#" + newB + "#", function (err, results) {	//	in the specified format:
        if (err) {																		//	$rrr#ggg#bbb#
            console.log("[ERROR] " + err + ": " + results);
        }
    });
}
