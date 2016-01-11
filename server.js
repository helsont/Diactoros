var express     = require('express');
var request     = require('request');
var bodyParser  = require('body-parser');
var notify      = require('push-notify');
var path        = require('path');

var port        = process.env.PORT || 5000;
var debugMode   = process.env.DEBUG;
var env         = process.env.NODE_ENV || 'development';
var gcmId       = process.env.GCM_ID;

var app         = express();
var startedTime = new Date();
var uptime      = Date.now();

app.use(bodyParser.json());
app.listen(port);

var key, cert, apn, apnKeyPath, apnCertPath, gcm;

if (env == 'production') {
  console.log('Starting in production mode');
  key = '/' + process.env.PROD_APN_KEY;
  cert = '/' + process.env.PROD_APN_CERT;
  debugMode = false;
} else {
  console.log('Starting in development mode');
  key = '/' + process.env.STAGING_APN_KEY;
  cert = '/' + process.env.STAGING_APN_CERT;

  // Only set debugMode in development mode
  debugMode = debugMode || false;
}

apnKeyPath = path.join(process.cwd(), key);
apnCertPath = path.join(process.cwd(), cert);
apn = notify.apn({
  key: apnKeyPath,
  cert: apnCertPath
});

gcm = notify.gcm({
  apiKey: gcmId,
  retries: 3
});

function debug(str) { if (debugMode) console.log(str); }

var sendGCM = function(deviceId, collapseKey, sendData) {
  var notification = {
    registrationId: deviceId,
    collapseKey: collapseKey,
    delayWhileIdle: true,
    timeToLive: 3,
    data: sendData
  };
  debug('[GCM]' + JSON.stringify(notification, null, 3));
  gcm.send(notification);
};

var sendAPN = function(deviceId, sendData) {
  var push = {
    token: deviceId,
    payload: {
      aps: sendData
    }
  };
  debug('[APN]:' + JSON.stringify(push, null, 3));
  apn.send(push);
};

app.get('/', function(request, response) {
  var uptimeInSeconds = (Date.now() - uptime) / 1000;
  response.send({started: startedTime, uptime: uptimeInSeconds});
});

gcm.on('transmitted', function (result, message, registrationId) {
  console.log('gcm.transmitted');
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

apn.on('transmitted', function (notification, device, q) {
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
    response.send({status: 1, message: 'success'});
  }
});

app.post('/APN', function(request, response) {
  var body = request.body,
    data = body['data'],
    tokens = body['tokens'];

  if(!body) {
    response.status(400);
    response.send({status: 0, error: '400: Bad request. Specfiy a JSON object.', url: request.url });

  } else if(!data) {
    response.status(400);
    response.send({status: 0, error: '400: Bad request. No data.', url: request.url });

  } else if(!tokens || tokens.length == 0) {
    response.status(400);
    response.send({status: 0, error: '400: Bad request. Specfiy a device token or tokens.', url: request.url });

  } else {
    sendAPN(tokens, data);
    response.send({status: 1, message: 'success'});
  }
});
