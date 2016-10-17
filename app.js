// ------------------
// Init Express
// ------------------
var express  = require('express'),
    app      = express(),
    PORT     = 3000,
    ws_address = '127.0.0.1:3000',

// Web Socket Support
var expressWs = require('express-ws')(app);

// View Engline
app.set('view engine', 'ejs');

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
app.use('/static', express.static('public'));
app.use(allowCrossDomain);

// ------------------
// Index 
// ------------------
app.get('/', function (req, res) {
    res.render('index', {
        title: 'Device List',
        websocket_address: ws_address
    });
});

// ------------------
// Single tag 
// ------------------
app.get('/sensor/:uuid', function (req, res) {
    res.render('sensor', {
        title: 'Sensor',
        websocket_address: ws_address,
        uuid: req.params.uuid
    });
});

// ------------------
// Start Express 
// ------------------
app.listen(PORT, function () {
    global.logging('Sensortag Websocket listening on port ' + PORT);
});

