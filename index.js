var API_VERSION = 1;
var config = {
    "port": 4242,
    "name": "Home", // Name displayed by server
    "device": "/dev/ttyACM0", // Path to Arduino
    "presets": [
        ["Off", [0, 0, 0]],
        ["Incandescent Hi", [255, 60, 20]],
        ["Incandescent Lo", [255, 60, 30]],
        ["Full white", [255, 255, 255]],
        ["Red", [255, 0, 0]],
        ["Green", [0, 255, 0]],
        ["Blue", [0, 0, 255]]
    ],
    "defaultMode": "jump",
    "username": "Billy", // If username/password are empty then no auth is needed
    "password": "mypass"
};
var express = require('express');
var app = express();
var http = require('http').Server(app);
var basicAuth = require('basic-auth');
var bodyParser = require('body-parser');
// @TODO: Replace the duplicate vars with different names
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
// var serial = new SerialPort(config.device, {
//     baudrate: 9600,
//     parser: serialport.parsers.readline("\n")
// });
var colors = { "r": 0, "g": 0, "b": 0 };
var servermode = "solid";

app.use(bodyParser.urlencoded({
    extended: true
}));

// Check if username/password is set
function needsAuth(req, res, next) {
    function unauthorized(res) {
        console.log("[INFO] Received unauthorized " + req.originalUrl + " request");
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
    }

    if(config.username === "" && config.password === ""){
        return next();
    }

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    }

    if (user.name === config.username && user.pass === config.password) {
        return next();
    } else {
        return unauthorized(res);
    }
}

// Send a color to the Arduino and lights
function sendColor(newR, newG, newB) {
    //	in the specified format: $rrr#ggg#bbb#
    serial.write("$" + newR + "#" + newG + "#" + newB + "#", function (err, results) {
        if (err) {
            console.log("[ERROR] " + err + ": " + results);
        }
    });
}

// Initiate serial connection with Arduino and wait for ready signal
serial.on("open", function () {
    console.log('[INFO] Opening serial port...');
    serial.on('data', function (data) {
        if (data.trim() === "ok") {
            console.log("[INFO] Ready for requests.");
        } else {
            console.log("[ERROR] received unexpected serial data:");
        }
    });
});

// Start HTTP server
http.listen(config.port, function () {
    console.log('[INFO] Server listening on *:' + config.port);
});

app.get('/status/', needsAuth, function (req, res) {
    res.send({
        "version": API_VERSION,
        "mode": servermode,
        "colorsRGB": [colors.r, colors.g, colors.b],
        "name": config.name,
        "presets": config.presets
    });
    console.log("[INFO] Received status request");
});

// Post a new color/mode to the server to update the lights
app.post('/v1/update/', needsAuth, function (req, res) {
    reqmode = req.body.mode || config.defaultMode;
    if (reqmode === "jump") { // Instant color switch
        servermode = "solid";
        console.log("[INFO] Jumping to " + "(" + req.body.r + ", " + req.body.g + ", " + req.body.b + ")");
        colors.r = req.body.r;
        colors.g = req.body.g;
        colors.b = req.body.b;
        sendColor(colors.r, colors.g, colors.b);
    }
    if (reqmode === "fade") { // Fade over time
        servermode = "solid"; // @TODO: change increment for a faster fade?
        console.log("[INFO] Fading to " + "[" + req.body.r + " " + req.body.g + " " + req.body.b + "]");
        var stepcount = 0;
        while (colors.r !== req.body.r || colors.g !== req.body.g || colors.b !== req.body.b) {
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
    if (mode === "pulse") {
        // @TODO: Implement mode, future API version
    }
    if (mode === "blink") {
        // @TODO: Implement mode, future API version
    }
    if (mode === "disco") {
        // @TODO: Implement mode, future API version
    }
    res.end();
});
