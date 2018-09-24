'use strict';

/**
* Web Server module
* @module web
*/

const debug = require('debug')('miner:web');
const config = require('../config');
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const auth = require('http-auth');
const path = require('path');
const randomstring = require('randomstring');

var privateKey  = fs.readFileSync(path.join(path.resolve().replace('lib', ''),'sslcert/server.key'), 'utf8');
var certificate = fs.readFileSync(path.join(path.resolve().replace('lib', ''),'sslcert/server.crt'), 'utf8');

var credentials = {key: privateKey, cert: certificate};

// create app
var app = express();

//session
app.use(session({secret: randomstring.generate()}));

// auth
// var basic = auth.basic({
//     realm: "Admin"
// }, function(username, password, callback){
//     callback(username === config.ADMIN_USER && password === config.ADMIN_PASSWORD);
// });
// app.use(auth.connect(basic));

// post parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

module.exports.app = app;

module.exports.start = function(){

  //
  app.use(express.static(path.join(path.resolve(), 'static'), { fallthrough: true }));

  // error handler
  app.use(function(err, req, res, next){
      console.error(err);
      //
      res
      .status(err.status || 500)
      .format({
          text: function(){
              res.send(err.message);
          },
          html: function(){
              res.send(err.message);
          },
          json: function(){
              res.json({
                  message: err.message
              });
          }
      });
  });

  var httpServer = http.createServer(function(req, res){
    res.writeHead(301, { "Location": "https://" + req.headers['host'].replace(config.API_HTTP_PORT, config.API_HTTPS_PORT) + req.url});
    res.end();
  });
  var httpsServer = https.createServer(credentials, app);


  httpServer.listen(config.API_HTTP_PORT, 'localhost');
  httpsServer.listen(config.API_HTTPS_PORT, 'localhost');

  return httpsServer;

}
