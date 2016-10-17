'use strict';

var express   = require('express'),
	router    = express.Router(),
	SensorTag = require('sensortag'),
	device_info  = {}, // Global device recorder
	_tag		 = {}, // Global tag accessor
	_log_every   = false,
	time_to_connect = 7000; // Time to stop discover

global.logging('Sensortag module loaded');

// Handle Event 
var EventEmitter = require('events').EventEmitter,
	events		 = new EventEmitter();

// Duplicates allowed -> Reconnect possible
SensorTag.SCAN_DUPLICATES = true;

// Timeout for watchdog 
var timeoutVar = 7000;
var scanning = false;

// Handle Exception
process.on('uncaughtException', function(err) {
	console.error('uncaughtException restart process');
	console.error(err);
	process.exit(0);
});

// Intercept Noble Device Error
console.warn = function(d) {

	// Starts with
	if ( d.lastIndexOf('noble warning', 0) === 0 ) {
		console.error(d);
		console.error('Intercept noble warning, restarting process...');
		process.exit(0);
	} else {
    	process.stderr.write(d + '\n');
   	}
};

// ------------------------------------
// Listen to Connected Device
// ------------------------------------
router.ws('/connected', function(ws, req) {

	global.logging('ws:// connected');

	// Send init
	ws.send(JSON.stringify(device_info), function(error) {
	   	if(error)
	   		console.error(error);
	});

	events.on('device_disconnect', function() {
		ws.send(JSON.stringify(device_info), function(error) {
		   	if(error)
		   		console.error(error);
		});
	});

	events.on('device_connect', function() {
		ws.send(JSON.stringify(device_info), function(error) {
		   	if(error)
		   		console.error(error);
		});
	});
});


// ------------------------------------
// WebSocket Humidity 
// ------------------------------------
router.ws('/humidity/:uuid', function(ws, req) {

	var uuid = req.params.uuid;

	if( uuid == undefined || _tag[uuid] == undefined ) {
		global.logging('Device uuid not defined or not found');
		ws.close(); // Cloase Connection
	}

	global.logging('ws:// humidity/' + uuid);

	_tag[uuid].on('humidityChange', function (temperature, humidity) {

		if(_log_every) {
		   	global.logging('temperature = ' + temperature);
		   	global.logging('humidity = ' + humidity);
		}

		// Make json object with UUID
		var obj = {};

		obj[uuid] = {
	   		temperature: temperature, 
	   		humidity: humidity
	   	};

	   	ws.send(JSON.stringify(obj), function(error) {
	   		if(error && _log_every){
	   			console.error(error);
	   		}
	   	});
	});
});

// ------------------------------------
// WebSocket Pressure 
// ------------------------------------
router.ws('/barometricPressure/:uuid', function(ws, req) {

	var uuid = req.params.uuid;

	if( uuid == undefined || _tag[uuid] == undefined ) {
		global.logging('Device uuid not defined or not found');
		ws.close(); // Cloase Connection
	}

	global.logging('ws:// barometricPressure/' + uuid);

	_tag[uuid].on('barometricPressureChange', function(pressure) {

		if(_log_every) {
			global.logging('pressure = ' + pressure);
		}

	   	// Make json object with UUID
		var obj = {};

		obj[uuid] = {
			pressure: pressure
		};

	   	ws.send(JSON.stringify(obj), function(error) {
	   		if(error && _log_every){
	   			console.error(error);
	   		}
	   	});
	});
});

// ------------------------------------
// WebSocket irTemperature 
// ------------------------------------
router.ws('/irTemperature/:uuid', function(ws, req) {

	var uuid = req.params.uuid;

	if( uuid == undefined || _tag[uuid] == undefined ) {
		global.logging('Device uuid not defined or not found');
		ws.close(); // Cloase Connection
	}

	global.logging('ws:// irTemperature/' + uuid);

	_tag[uuid].on('irTemperatureChange', function (objectTemperature, ambientTemperature) {

		if(_log_every) {
	    	global.logging('objectTemperature = ' + objectTemperature);
	    	global.logging('ambientTemperature = ' + ambientTemperature);
	    }

	   	// Make json object with UUID
		var obj = {};

		obj[uuid] = {
	    	objectTemperature: objectTemperature, 
	    	ambientTemperature: ambientTemperature
	    };

	   	ws.send(JSON.stringify(obj), function(error) {
	   		if(error && _log_every){
	   			console.error(error);
	   		}
	   	});
	});
});



function tagDiscovery(tag) {

	// Stop Bluetooth discovering
	stop_discover();

	global.logging('discovered: ' + tag.address + ', type = ' + tag.type);

	// connect me this tag
	connectAndSetUpMe();

	var watchDogFlag = true;

	tag.on('disconnect', function() {

		global.logging(tag.address + '(' + tag.type +') disconnected!');

		// Remove Property
		delete device_info[tag.uuid];

		// Emit Disconnected Event
		events.emit('device_disconnect');

		// Resume scanning
	    start_discover();
	});

	function watchDog() {

		if(watchDogFlag) {

			global.logging('watchDog invoked, force disconnected');
			tag.disconnect();
		}
	}

	function connectAndSetUpMe() {			
    	
    	global.logging(tag.address + '(' + tag.type +') connectAndSetUp');
    	tag.connectAndSetUp(enableService);		

    	device_info[tag.uuid] = {
    		id        : tag.id,
    		uuid      : tag.uuid,
    		type	  : tag.type,
    		address   : tag.address,
    	};

    	global.logging('Device Info');
    	console.log(device_info[tag.uuid]);

    	setTimeout(watchDog, timeoutVar);
    }

    function enableService(error) {		
		
		if ( error != undefined ) {
			console.error('ERROR connectAndSetUpMe!');
		}

		global.logging(tag.address + '(' + tag.type +') enableService');

		// Emit connected Devent
		events.emit('device_connect');

		// Map tag to global for ws
		_tag[tag.uuid] = tag;

		// Enable Service
    	tag.enableHumidity(function(){
    		tag.notifyHumidity();
    	});

    	tag.enableIrTemperature(function() {
    		tag.notifyIrTemperature();
    	});

    	tag.enableBarometricPressure(function() {
    		tag.notifyBarometricPressure();
    	});

    	tag.notifySimpleKey(listenForButton);

    	// Mark connected
    	watchDogFlag = false;

    	// Resume Scan
    	start_discover();
    }

	// when you get a button change, print it out:
	function listenForButton() {

		tag.on('simpleKeyChange', function(left, right) {

			if (left) {
				global.logging(tag.address + '(' + tag.type +')> left: ' + left);
			}

			if (right) {
				global.logging(tag.address + '(' + tag.type +')> right: ' + right);
			}

			// if both buttons are pressed, disconnect:
			if (left && right) {
				global.logging(tag.address + '(' + tag.type +')> Both BTN Pressed');
				tag.disconnect();
			}
	   });
	}

}

function start_discover() {

	if(scanning)
		return;

	scanning = true;
	global.logging('scanTimed: Start discovering');
	SensorTag.discover(tagDiscovery);
}

function stop_discover() {

	scanning = false;
	SensorTag.stopDiscoverAll(function(){});
	global.logging('stopTimed: Stop discovering');
}

// Start discovering
start_discover();

module.exports = router;
