var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var notify = require('push-notify');
var app = express();
var port = process.env.PORT || 5000;
var startedTime = new Date();
var uptime = Date.now();

app.use(bodyParser.json());
app.listen(port);

var gcm = notify.gcm({
	apiKey: '',
	retries: 3
});

var path = require('path');
var env = process.env.NODE_ENV || 'development';
var key, cert;

if (env == 'production') {
	console.log('Starting in production mode');
	key = '/' + process.env.PROD_APN_KEY;
	cert = '/' + process.env.PROD_APN_CERT;
} else {
	console.log('Starting in development mode');
	key = '/' + process.env.STAGING_APN_KEY;
	cert = '/' + process.env.STAGING_APN_CERT;
}

var apnKeyPath = path.join(process.cwd(), key);
var apnCertPath = path.join(process.cwd(), cert);
var apn = notify.apn({
  key: apnKeyPath,
  cert: apnCertPath
});

var sendGCM = function(deviceId, collapseKey, sendData) {
	return; // not yet implemented.
	var push = {
		registrationId: deviceId,
		collapseKey: collapseKey,
		delayWhileIdle: true,
		timeToLive: 3,
		data: sendData
	};

	console.log(JSON.stringify(push, null, 3));
	gcm.send({
		registrationId: deviceId,
		collapseKey: collapseKey,
		delayWhileIdle: false,
		timeToLive: 3,
		data: sendData
	});
};

var sendAPN = function(deviceId, sendData) {
	var push = {
		token: deviceId,
		payload: {
			aps: sendData
		}
	};
	console.log(JSON.stringify(push, null, 3));
	apn.send(push);
};

app.get('/', function(request, response) {
		var uptimeInSeconds = (Date.now() - uptime) / 1000;
		response.send({started: startedTime, uptime: uptimeInSeconds});
});

gcm.on('transmitted', function (result, message, registrationId) {
	console.log('gcm.on transmitted');
});

gcm.on('transmissionError', function (error, notification, registrationId) {
	console.log('>>>>>>>>>>>>>>>>>>');
	console.log('gcm.on transmissionError\n');
	console.log('error:' + error);
	console.log('notification:' + JSON.stringify(notification));
	console.log('registrationId:' + registrationId);
	console.log('>>>>>>>>>>>>>>>>>>');
});

gcm.on('updated', function (result, registrationId) {
	console.log('gcm on updated');
});

apn.on('transmitted', function (notification, device) {
	console.log('apn.on transmitted');
});

apn.on('transmissionError', function (errorCode, notification, device) {
	console.log('>>>>>>>>>>>>>>>>>>');
	console.log('apn.on transmissionError\n');
	console.log('errorCode:' + errorCode);
	console.log('notification:' + JSON.stringify(notification));
	console.log('device:' + device);
	console.log('>>>>>>>>>>>>>>>>>>');
});

apn.on('error', function (error) {
	console.log('>>>>>>>>>>>>>>>>>>');
	console.log('apn.on error\n');
	console.log('error:' + error);
	console.log('>>>>>>>>>>>>>>>>>>');
});

app.post('/GCM', function(request, response) {
	var body = request.body;
	
	var data = body['data'];
	var tokens = body['tokens'];
	var collapseKey = body['collapseKey'];

	if(!body) {
		response.status(400);
		response.send({error: '400: Bad request. Specfiy a JSON object.', url: request.url });

	} else if(!data) {
		response.status(400);
    response.send({title: '400: Bad request. No data.', url: request.url });

	} else if(!tokens) {
		response.status(400);
		response.send({title: '400: Bad request. Specfiy a device token or tokens.', url: request.url });

	} else {
		var collapseKey = collapseKey == null ? 'New notifications' : body.collapseKey;
		sendGCM(tokens, collapseKey, data);
		// response.send('Success');
		response.send('Error: Not yet implemented.');

	}
});

// This is what a proper POST request looks like
// {
//    "tokens":[
//       "602d191b48ccd88e6af76e93d07e7a3b21953ea4d7e894e5d41713ee5343608b"
//    ],
//    "data":{
//      "aps":{
//          "alert":"Hey there !",
//          "badge":0,
//          "sound":9,
//          "message":"My new message"
//      }
      
//    }
// }


app.post('/APN', function(request, response) {
	var body = request.body;
	
	var data = body['data'];
	var tokens = body['tokens'];

	if(!body) {
		response.status(400);
		response.send({error: '400: Bad request. Specfiy a JSON object.', url: request.url });

	} else if(!data) {
		response.status(400);
    response.send({title: '400: Bad request. No data.', url: request.url });

	} else if(!tokens) {
		response.status(400);
		response.send({title: '400: Bad request. Specfiy a device token or tokens.', url: request.url });

	} else {

		sendAPN(tokens, data);
		response.send('Success');
	}
});