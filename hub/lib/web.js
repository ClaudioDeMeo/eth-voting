'use strict';

/**
* Web Server module
* @module web
*/

const debug = require('debug')('hub:web');
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

// create PRIVATE app
var privateApp = express();

//session
privateApp.use(session({
  secret: randomstring.generate(),
  resave: true,
  saveUninitialized: true
}));

// auth
// var basic = auth.basic({
//     realm: "Admin"
// }, function(username, password, callback){
//     callback(username === config.ADMIN_USER && password === config.ADMIN_PASSWORD);
// });
// privateApp.use(auth.connect(basic));

// post parser
privateApp.use(bodyParser.json());
privateApp.use(bodyParser.urlencoded({
  extended: true
}));

// create PUBLIC app
var publicApp = express();

//session
publicApp.use(session({
  secret: randomstring.generate(),
  resave: true,
  saveUninitialized: true
}));

// post parser
publicApp.use(bodyParser.json());
publicApp.use(bodyParser.urlencoded({
  extended: true
}));

module.exports.private = privateApp;

module.exports.public = publicApp;

module.exports.start = function(){

  //
  privateApp.use(express.static(path.join(path.resolve(), 'static/private'), { fallthrough: true }));

  //
  publicApp.use(express.static(path.join(path.resolve(), 'static/public'), { fallthrough: true }));

  // error handler
  privateApp.use(function(err, req, res, next){
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

  // error handler
  publicApp.use(function(err, req, res, next){
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

  var httpPrivateServer = http.createServer(function(req, res){
    res.writeHead(301, { "Location": "https://" + req.headers['host'].replace(config.API_HTTP_PRIVATE_PORT, config.API_HTTPS_PRIVATE_PORT) + req.url});
    res.end();
  });
  var httpsPrivateServer = https.createServer(credentials, privateApp);

  var httpPublicServer = http.createServer(function(req, res){
    res.writeHead(301, { "Location": "https://" + req.headers['host'].replace(config.API_HTTP_PUBLIC_PORT, config.API_HTTPS_PUBLIC_PORT) + req.url});
    res.end();
  });
  var httpsPublicServer = https.createServer(credentials, publicApp);


  httpPrivateServer.listen(config.API_HTTP_PRIVATE_PORT, 'localhost');
  httpsPrivateServer.listen(config.API_HTTPS_PRIVATE_PORT, 'localhost');

  httpPublicServer.listen(config.API_HTTP_PUBLIC_PORT);
  httpsPublicServer.listen(config.API_HTTPS_PUBLIC_PORT);

  return {
    private: httpsPrivateServer,
    public: httpsPublicServer
  };

}
