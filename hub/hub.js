'use strict';

/**
* Hub main module
* @module hub
*/

const debug = require('debug')('hub');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const Web3 = require('web3');
const node = require('./lib/node');
require('./lib/adb')();
const server = require('./lib/web');
const utils = require('./lib/utils');
const crypto = require('./lib/crypto');

//Telegram bot
const Telegraf = require('telegraf');
const bot = new Telegraf(config.TELEGRAM_TOKEN);

//PRIVATE INTERFACE

//mongo db private connection
var hub = null;
var voters = null;
require('./lib/db_access')(config.MONGO_HUB_URL, server.private)
  .then((db) => {
    hub = db.hub;
    voters = db.voters;
  })
  .catch((err) => {
    console.log("Mongo db hub error:", err);
  });

/** Web3 interface */
var web3 = null;

// setInterval(function(){
//   web3 && web3.eth.getAccounts().then((accounts)=>{
//     web3.eth.getBalance(accounts[0]).then((b)=>{
//       debug(b);
//
//     });
//   });
// },1000);

/** Contract instance */
var contract = null;

var model = null;
/** String path to blockchain database direcory */
const db_dir = config.DB_DIR || path.join(path.reolve(), 'node');

node.init()
.then((geth, args)=>{
  console.log("Node initialized!");
  // hub = geth;
  web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:' + (config.WS_RPC_PORT || 8546)));
}).catch((err)=>{
  console.log("Node error:", err);
});


/**
 * @function getAccount
 * @param {callback} cb callback return account from web3
 * @description return account from web3
 */
function getAccount(cb){
  web3.eth.getAccounts()
    .then((accounts) => {
      cb && cb(accounts[0] || null);
    })
    .catch((err) => {
      cb && cb(null);
    });
}

function getContract(){
  utils.request(config.ENDPOINT, '/api', true, function(data){
    if (data && !data.error){
      getAccount(function(account){
        if (account){
          contract = new web3.eth.Contract(data.result.abi, data.result.address, {
            from: account
          });
        }
      });
      model = data.result.model;
    }else{
      debug("error:", data && data.error);
      setTimeout(getContract, 100);
    }
  });
}

server.private.get('/', function(req, res){
  if(web3){
    if (req.session.account && req.session.password){
      web3.eth.personal.unlockAccount(req.session.account, req.session.password, 3600)
        .then(() => {
          if (!contract){
            getContract();
          }
          res.sendFile(path.join(path.resolve(), 'static/private/hub.html'));
        })
        .catch(() => {
          delete req.session.hubname;
          delete req.session.account;
          delete req.session.password;
          res.sendFile(path.join(path.resolve(), 'static/private/login.html'));
        });
    }else{
      res.sendFile(path.join(path.resolve(), 'static/private/login.html'));
    }
  }else{
    res.redirect('/');
  }
});

/**
 * Interface to get account
 * @interface /account
 */
server.private.get('/account', function(req, res){
  if(web3){
    getAccount(function(account){
      req.session.account = account;
      res.json({ready: true, account: account, hub: req.session.hubname, publicPort: config.API_HTTPS_PUBLIC_PORT});
    })
  }else{
    res.json({ready: false});
  }
});

/**
 * Interface to create new account
 * @interface /newaccount
 */
server.private.post('/newaccount', function(req,res){
  if(web3 && hub){
    if (req.body.hubname && req.body.password){
      hub.find(req.body.hubname, function(data){
        if (!data || data.length == 0){
          getAccount(function(account){
            if (account){
              res.redirect('/');
            }else{
              var password = crypto.encrypt(req.body.password);
              if (password){
                web3.eth.personal.newAccount(req.body.password)
                  .then((account) => {
                    web3.eth.personal.unlockAccount(account, req.body.password, 3600)
                      .then(() => {
                        hub.create(req.body.hubname, password, account, function(err){
                          if (!err){
                            req.session.hubname = req.body.hubname;
                            req.session.account = account;
                            req.session.password = req.body.password;
                            res.json({ready: true});
                          }else{
                            res.json({ready: true, error: "Account not created!"});
                          }
                        });
                      })
                      .catch(() => {
                        hub.remove(req.body.hubname, password);
                        delete req.session.hubname;
                        delete req.session.password;
                        res.json({ready: true, error: "Wrong Password"});
                      });
                  })
                  .catch((err) => {
                    hub.remove(req.body.hubname, password);
                    delete req.session.hubname;
                    delete req.session.account;
                    delete req.session.password;
                    res.json({ready: true, error: "New Account not created!"});
                  });
              }else{
                res.json({ready: true, error: "Encrypt password error."});
              }
            }
          });
        }else{
          res.json({ready: true, error: "Hub already exists"});
        }
      });
    }else{
      res.json({ready: true, error: "Missing data"});
    }
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Interface to login with the account
 * @interface /login
 */
server.private.post('/login', function(req,res){
  if(web3 && hub){
    if(req.body.hubname && req.body.password){
      hub.find(req.body.hubname, function(data){
        if (data[0] && data[0].name == req.body.hubname && crypto.decrypt(data[0].password) == req.body.password){
          getAccount(function(account){
            if (account && account == data[0].account){
              web3.eth.personal.unlockAccount(account, req.body.password, 3600)
                .then(() => {
                  req.session.hubname = req.body.hubname;
                  req.session.account = account;
                  req.session.password = req.body.password;
                  res.json({ready: true});
                })
                .catch(() => {
                  delete req.session.hubname;
                  delete req.session.password;
                  res.json({ready: true, error: "Wrong Password"});
                });
            }else{
              delete req.session.hubname;
              delete req.session.account;
              delete req.session.password;
              res.json({ready: true, error: "Incorrect Hub"});
            }
          });
        }else{
          delete req.session.hubname;
          delete req.session.password;
          res.json({ready: true, error: "Wrong Password"});
        }
      });
    }else{
      res.json({ready: true, error: "Missing data"});
    }
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Private interface to logout the account
 * @interface /exit
 */
server.private.get('/exit', function(req, res){
  delete req.session.hubname;
  delete req.session.account;
  delete req.session.password;
  res.redirect('/');
});

//PUBLIC INTERFACE

//mongo db public connection
var tellers = null;
// var voters = null;
require('./lib/db_access')(config.MONGO_TELLER_URL, server.public)
  .then((db) => {
    tellers = db.tellers;
  })
  .catch((err) => {
    console.log("Mongo db teller error:", err);
  });

server.public.get('/',function(req, res){
  if (tellers){
    if (req.session.cf && req.session.password){
      tellers.auth(req.session.cf, req.session.password, function(err, auth){
        if (!err && auth){
          res.sendFile(path.join(path.resolve(), 'static/public/teller.html'));
        }else{
          delete req.session.cf;
          delete req.session.password;
          res.sendFile(path.join(path.resolve(), 'static/public/login.html'));
        }
      });
    }else{
      res.sendFile(path.join(path.resolve(), 'static/public/login.html'));
    }
  }else{
    res.redirect('/');
  }
});

/**
 * Public Interface to get teller access data
 * @interface /access
 */
server.public.get('/access', function(req, res){
  if (tellers){
    tellers.find(req.session.cf, function(err, teller){
      if (!err && teller){
        res.json({ready: true, teller: teller});
      }else{
        res.json({ready: true, error: "Not Found"});
      }
    });
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Public Interface to get teller data
 * @interface /teller
 */
server.public.get('/tellers/:cf', function(req, res){
  if (tellers){
    tellers.find(req.params.cf, function(err, teller){
      if (!err && teller){
        res.json({ready: true, teller: teller});
      }else{
        res.json({ready: true, error: "Not Found"});
      }
    });
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Public Interface to login as teller
 * @interface /login
 */
server.public.post('/login', function(req, res){
  if (tellers){
    if(req.body.cf && req.body.password){
      tellers.auth(req.body.cf, req.body.password, function(err, auth){
        if (!err && auth){
          req.session.cf = req.body.cf;
          req.session.password = req.body.password;
          res.json({ready: true});
        }else{
          delete req.session.cf;
          delete req.session.password;
          res.json({ready: true, error: "Wrong Password"});
        }
      });
    }else{
      res.json({ready: true, error: "Missing data"});
    }
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Public interface to set voted a voter
 * @interface /voted
 */
server.public.post('/voted', function(req, res){
  if (voters){
    voters.setVoted(req.body.voter)
      .then((data) => {
        if (data && !data.error){
          res.json({ready: true, result: data.result});
        }else{
          res.json({ready: true, error: (data && data.error) || "Error"});
        }
      })
      .catch((e) => {
        debug("error", e)
        res.json({ready: true, error: e});
      });
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Public interface to enable vote
 * @interface /enableVote
 */
server.public.post('/enableVote', function(req, res){
  if (voters){
    voters.getChatId(req.body.voter)
      .then((data) => {
        if (data && !data.voted){
          if (data.chatId){
            voters.generateOTP(req.body.voter)
              .then((immQR) => {
                bot.telegram.sendPhoto(data.chatId, {source: immQR})
                  .then((e)=>{
                    res.json({ready: true, result: "OTP sent"});
                  })
                  .catch((e)=>{
                    res.json({ready: true, error: "Bot Error"});
                  });
              })
              .catch((err)=>{
                debug("OTP generation error:", err);
                res.json({ready: true, error: "Error with otp generation"});
              });
          }else{
            res.json({ready: true, error: "Bot not initialized"});
          }
        }else{
          res.json({ready: true, error: "Already voted"});
        }
      })
      .catch((e) => {
        debug("error", e)
        res.json({ready: true, error: e});
      });
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Public interface to voter page
 * @interface /voter
 */
server.public.get('/voter', function(req, res){
  if (req.session.auth){
    res.sendFile(path.join(path.resolve(), 'static/public/voter.html'));
  }else{
    res.sendFile(path.join(path.resolve(), 'static/public/voter-login.html'));
  }
});

/**
 * Public interface to get session variable
 * @interface /session
 */
server.public.get('/session', function(req, res){
  if (voters && model){
    if (req.session.auth && req.session.token && req.session._id){
      voters.authOtp(req.session._id, req.session.token)
        .then((result) =>{
          if (result.auth){
            res.json({
              ready: true,
              id: req.session._id,
              auth: result.auth,
              token: req.session.token,
              time_remaining: result.time_remaining,
              time_used: result.time_used,
              model: model
            });
          }else{
            delete req.session._id;
            delete req.session.auth;
            delete req.session.token;
            res.json({ready: true, auth: false});
          }
        })
        .catch((err) => {
          res.json({ready: true, error: err});
        });
    }else{
      res.json({ready: true, auth: false});
    }
  }else{
    if (!model){
      getContract();
    }
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Public interface to auth voter to vote from otp
 * @interface /authOtp
 */
server.public.post('/authOtp/:id', function(req, res){
  if (voters){
    if (req.params.id && req.params.id.length > 0 && req.body.token && req.body.token.length > 0){
      voters.authOtp(req.params.id, req.body.token)
        .then((result) =>{
          req.session._id = req.params.id;
          req.session.auth = result.auth;
          req.session.token = req.body.token;
          setTimeout(function(){
            delete req.session._id;
            delete req.session.auth;
            delete req.session.token;
          },result.time_remaining * 1000);
          res.json({ready: true, result: result});
        })
        .catch((err) => {
          debug(err)
          res.json({ready: true, error: err});
        });
    }else{
      res.json({ready: true, error: "Missing data"});
    }
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Public interface to submit a vote
 * @interface /submitVote
 */
server.public.post('/submitVote', function(req, res){
  if (web3 && voters && hub && contract){
    if (req.session.token && req.session._id){
      voters.authOtp(req.session._id, req.session.token)
        .then((result) =>{
          if (result.auth){
            getAccount(function(account){
              if (account){
                hub.findByAccount(account, function(hubs){
                  if (hubs[0]){
                    var password = crypto.decrypt(hubs[0].password);
                    web3.eth.personal.unlockAccount(account, password, 3600)
                      .then(async () => {
                        voters.setVoted(req.session._id)
                        .then((data) => {
                          if (data && !data.error){
                            if (!req.body.list && req.body.candidate){
                              contract.methods.voteCandidate(req.body.candidate).estimateGas()
                                .then(async (gas)=>{
                                  debug("input", req.body.candidate)
                                  contract.methods.voteCandidate(req.body.candidate).send({
                                    gas: Math.round(gas+gas*20/100)
                                  })
                                    .then((e) => {
                                      debug("then",e);
                                    }).catch((e,r)=> {
                                      debug("catch", e)
                                    });
                                })
                                .catch((e)=>{
                                  debug(e)
                                })
                            }else if(req.body.list){
                              var c = parseInt(req.body.list.split('-')[0]);
                              var l = parseInt(req.body.list.split('-')[1]);
                              contract.methods.voteList(c, l).estimateGas()
                                .then((gas) =>{
                                  contract.methods.voteList(c, l).send({
                                    gas: Math.round(gas+gas*20/100)
                                  })
                                    .then((e) => {
                                      debug("then",e);
                                    }).catch((e)=>{
                                      debug("catch", e);
                                    });
                                })
                                .catch((e) =>{
                                  debug(e);
                                });
                            }
                            delete req.session._id;
                            delete req.session.auth;
                            delete req.session.token;
                            res.json({ready: true, result: data.result});
                          }else{
                            res.json({ready: true, error: (data && data.error) || "Error"});
                          }
                        })
                        .catch((e) => {
                          debug("error", e)
                          res.json({ready: true, error: "Error"});
                        });
                      })
                      .catch((e) => {
                        debug("Error", e);
                        req.json({ready: true, error: "Error"});
                      });
                  }else{
                    res.json({ready: true, error: "hub not found"});
                  }
                });
              }else{
                res.json({ready: true, error: "The hub cannot send vote without account"});
              }
            });
          }else{
            req.json({ready: true, error: "Token expired"});
          }
        })
        .catch((err) => {
          debug(err)
          res.json({ready: true, error: err});
        });
    }else{
      req.json({ready: true, error: "Token expired"});
    }
  }else{
    if (!contract){
      getContract();
    }
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Public interface to logout as teller
 * @interface /exit
 */
server.public.get('/exit', function(req, res){
  delete req.session.cf;
  delete req.session.password;
  res.redirect('/');
});

//start server with public socket interface
var io = require('socket.io')(server.start().public);

io.on('connection', function(socket){

  var updateInterval = null;

  socket.on('ready', function(data){
    function init(){
      if (voters){
        updateInterval = setInterval(function(){
          voters.getStats(data.hub)
          .then((stats) =>{
            socket.emit('stats', stats[0]);
          }).catch(() => {});
        },1000);
      }else{
        setTimeout(init, 200);
      }
    }
    init();
  });

  socket.on('disconnected', function(){
    clearInterval(updateInterval);
  })

});
