// ------------------
// Init Express
// ------------------
var express  = require('express'),
    app      = express(),
    PORT     = 3000;

// Web Socket Support
var expressWs = require('express-ws')(app);

// Logging Function
global.logging = function (str) {

    var moment = require('moment'),
        now    = moment().format("YYYY-MM-DD HH:mm:ss");

    console.log('[%s] %s', now, str);
}

// Middleware: Allow Crossdomain for websocket
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

// ------------------
// Load Module 
// ------------------
var sensortag = require('./routes/sensortag');
app.use('/sensortag', sensortag);
app.use(allowCrossDomain);

// ------------------
// Index 
// ------------------
app.get('/', function (req, res) {
    res.send('Hello');
});

// ------------------
// Start Express 
// ------------------
app.listen(PORT, function () {
    global.logging('Sensortag Websocket listening on port ' + PORT);
});

