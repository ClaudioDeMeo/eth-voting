'use strict';

/**
* Miner main module
* @module miner
*/

const debug = require('debug')('miner');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const si = require('systeminformation');
const Web3 = require('web3');
const node = require('./lib/node');
require('./lib/adb')();
const server = require('./lib/web');
const utils = require('./lib/utils');

/** Web3 interface to miner */
var web3 = null;

/** geth miner process */
var miner = null;

/** String path to blockchain database direcory */
const db_dir = config.DB_DIR || path.join(path.reolve(), 'node');

node.init()
.then((geth)=>{
  console.log("Node initialized!");
  miner = geth;
  web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:' + (config.WS_RPC_PORT || 8546)));
   // web3 = new Web3('http://127.0.0.1:' + (config.RPC_PORT || 8545));
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

server.app.get('/', function(req, res){
  if(web3){
    if (req.session.account && req.session.password){
      web3.eth.personal.unlockAccount(req.session.account, req.session.password, 3600)
        .then(() => {
          res.sendFile(path.join(path.resolve(), 'static/miner.html'));
        })
        .catch(() => {
          delete req.session.account;
          delete req.session.password;
          res.sendFile(path.join(path.resolve(), 'static/login.html'));
        });
    }else{
      res.sendFile(path.join(path.resolve(), 'static/login.html'));
    }
  }else{
    res.redirect('/');
  }
});

/**
 * Interface to get account
 * @interface /account
 */
server.app.get('/account', function(req, res){
  if(web3){
    getAccount(function(account){
      req.session.account = account;
      res.json({ready: true, account: account});
    })
  }else{
    res.json({ready: false});
  }
});

/**
 * Interface to create new account
 * @interface /newaccount
 */
server.app.post('/newaccount', function(req,res){
  if(web3){
    getAccount(function(account){
      if (account){
        res.redirect('/');
      }else{
        web3.eth.personal.newAccount(req.body.password)
          .then((account) => {
            web3.eth.personal.unlockAccount(account, req.body.password, 3600)
              .then(() => {
                req.session.account = account;
                req.session.password = req.body.password;
                res.json({ready: true});
              })
              .catch(() => {
                delete req.session.password;
                res.json({ready: true, error: "Wrong Password"});
              });
          })
          .catch((err) => {
            delete req.session.account;
            delete req.session.password;
            res.json({ready: true, error: "New Account not created!"});
          });
      }
    })
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Interface to login with the account
 * @interface /login
 */
server.app.post('/login', function(req,res){
  if(web3){
    getAccount(function(account){
      if (account){
        web3.eth.personal.unlockAccount(account, req.body.password, 3600)
          .then(() => {
            req.session.account = account;
            req.session.password = req.body.password;
            res.json({ready: true});
          })
          .catch(() => {
            delete req.session.password;
            res.json({ready: true, error: "Wrong Password"});
          });
      }else{
        delete req.session.account;
        delete req.session.password;
        res.json({ready: true, error: "No Account"});
      }
    })
  }else{
    res.json({ready: false, error: "Not ready, retry now!"});
  }
});

/**
 * Interface to logout the account
 * @interface /exit
 */
server.app.get('/exit', function(req, res){
  delete req.session.account;
  delete req.session.password;
  res.redirect('/');
});

/**
 * Interface to start mining
 * @interface /start
 */
server.app.get('/start', function(req, res){
  debug('Start Mining');
  if(web3){
    if (req.session.password){
      getAccount(function(account){
        if (account){
          web3.eth.personal.unlockAccount(account, req.session.password, 3600)
            .then(() => {
              web3.eth.isMining()
                .then((mining) => {
                  if (!mining){
                    miner && miner.kill();
                    miner = utils.spawn('geth', miner.spawnargs.slice(1).concat([
                      '--miner.etherbase',
                      account,
                      '--mine',
                      '--miner.threads=' + (req.query.threads || 1),
                      '--miner.gasprice=1000'
                    ]));
                    web3 = null;
                    setTimeout(function(){
                      web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:' + (config.WS_RPC_PORT || 8546)));
                    },3000)
                  }
                  res.json({ready: true, mining: true});
                }).catch(() => {
                  res.json({ready: true, mining: true});
                });
            })
            .catch((e) => {
              delete req.session.password;
              res.json({ready: true, error: "access deined"});
              res.redirect('/');
            });
        }else{
          delete req.session.account;
          delete req.session.password;
          res.json({ready: true, error: "account not found"});
        }
      });
    }else{
      res.json({ready: true, error: "access deined"});
    }
  }else{
    res.json({ready: false});
  }
});

/**
 * Interface to stop mining
 * @interface /stop
 */
server.app.get('/stop', function(req, res){
  debug("STOP Mining");
  if(web3){
    if (req.session.password){
      getAccount(function(account){
        if (account){
          web3.eth.personal.unlockAccount(account, req.session.password, 3600)
            .then(() => {
              web3.eth.isMining()
                .then((mining) => {
                  if (mining){
                    miner && miner.kill();
                    miner = utils.spawn('geth', miner.spawnargs.slice(1, miner.spawnargs.length - 5));
                  }
                  web3 = null;
                  res.json({ready: true, mining: false});
                  setTimeout(function(){
                    web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:' + (config.WS_RPC_PORT || 8546)));
                  },3000);
                }).catch(() => {
                  res.json({ready: true, mining: true});
                });
            })
            .catch(() => {
              delete req.session.password;
              res.json({ready: true, error: "access deined"});
            });
        }else{
          delete req.session.account;
          delete req.session.password;
          res.json({ready: true, error: "account not found"});
        }
      });
    }else{
      res.json({ready: true, error: "access deined"});
    }
  }else{
    res.json({ready: false});
  }
});

//start server with socket
var io = require('socket.io')(server.start());

io.on('connection', function(socket){
  debug("new client: " + socket.id);
  var subscription = null;

  function newSubscription(){
    debug("New Subscription");
    subscription = web3.eth.subscribe('newBlockHeaders', function(error, result){
      if (error){
        debug("Subscription Event Error:", error);
      }
      debug("Subscription result", result);
    })
    .on("data", function(data){
      debug("new Data:", data);
      getAccount(function(account){
        if (data.miner == account){
          web3.eth.getBlockTransactionCount(data.number)
            .then((count) => {
              if(count > 0){
                Promise.all(new Array(count).fill(1).map(function(e,n){
                  return web3.eth.getTransactionFromBlock(data.hash, n);
                })).then((ret) => {
                  var transactions = ret.map(function(transaction){
                    return {
                      hash: transaction.hash,
                      index: transaction.transactionIndex,
                      from: transaction.from,
                      to: transaction.to,
                      value: web3.utils.fromWei(transaction.value, 'ether'),
                      gasPrice: transaction.gasPrice,
                      gas: transaction.gas,
                      input: transaction.input,
                    }
                  });
                  debug("transactions",transactions)
                  socket.emit('block', {
                    number: data.number,
                    hash: data.hash,
                    gasLimit: data.gasLimit,
                    gasUsed: data.gasUsed,
                    timestamp: data.timestamp,
                    transactions: transactions,
                    count: count
                  });
                }).catch((e) =>{
                  debug("hERE",e)
                  socket.emit('block', {
                    number: data.number,
                    hash: data.hash,
                    gasLimit: data.gasLimit,
                    gasUsed: data.gasUsed,
                    timestamp: data.timestamp,
                    count: 0
                  });
                });
              }else{
                socket.emit('block', {
                  number: data.number,
                  hash: data.hash,
                  gasLimit: data.gasLimit,
                  gasUsed: data.gasUsed,
                  timestamp: data.timestamp,
                  count: 0
                });
              }
            })
            .catch(() => {
              socket.emit('block', {
                number: data.number,
                hash: data.hash,
                gasLimit: data.gasLimit,
                gasUsed: data.gasUsed,
                timestamp: data.timestamp,
                count: 0
              });
            });
        }
      })
    });
  }

  function createSubscription(){
    if (web3){
        newSubscription();
    }else{
      setTimeout(createSubscription, 500);
    }
  }

  var interval = setInterval(function(){
    if(web3){
      getAccount(function(account){
        if (account){
          web3.eth.getBalance(account)
            .then((data) => {
              web3.eth.isMining()
                .then((mining) => {
                  if (!subscription && mining){
                    createSubscription();
                  }else if(subscription && !mining){
                    subscription.unsubscribe(function(error, success){
                      if(success){
                        debug('Successfully unsubscribed!');
                        subscription = null;
                      }
                    });
                  }
                  si.currentLoad()
                    .then((load) => {
                      socket.emit('status', {
                        mining: mining,
                        balance: web3.utils.fromWei(data, 'ether'),
                        cpu: load.currentload.toFixed(2)
                      });
                    });
                }).catch(()=>{});;
            });
        }else{
          web3.eth.isMining()
            .then((mining) => {
              si.currentLoad()
                .then((load) => {
                  socket.emit('status', {
                    mining: mining,
                    cpu: load.currentload.toFixed(2)
                  });
                })
            }).catch(()=>{});
        }
      });
    }else{
      if (subscription){
        subscription = null;
      }
      si.currentLoad()
        .then((load) => {
          socket.emit('status', {
            cpu: load.currentload.toFixed(2)
          });
        })
    }
  },1000)

  socket.on('disconnect', function(){
    clearInterval(interval);
    subscription && subscription.unsubscribe(function(error, success){
      if(success){
        debug('Successfully unsubscribed!');
        subscription = null;
      }
    });
  })

})
