'use strict';

/**
* An Ethereum node
* @module node
*/

const debug = require('debug')('miner:node');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const utils = require('./utils');

/** String path to blockchain database direcory */
const db_dir = config.DB_DIR || path.join(path.reolve(), 'node');

/** String path in which genesis file will be written */
const genesisPath = config.GENESIS || path.join(path.resolve(), 'genesis.json');

/** geth process */
var geth = null;

/** Genesis JSON structure */
var genesis = null;

/** Bootnodes enodes */
var enodes = [];

/**
* Initialization function of Ethereum node
* @export init
*/
module.exports.init = function(){
  debug('init start');

  var remainingBootnodes = config.BOOTNODE_URL;

  function bootRequests(cb){
    var element = remainingBootnodes.shift();
    if(element){
      debug("init -> request for genesis to:", element.href);
      utils.request(element, !genesis ? '/' : '/enode', true, (data) => {
        if (data.error){
          debug("request for genesis error:", data.error);
        }else{
          debug(data);
          if (genesis && data.genesis && data['public-key'] && data.port){
            enodes.push({ip: element.hostname, port: data.port, pubkey: data['public-key']});
          }else if(data.genesis && data['public-key'] && data.port){
            genesis = data.genesis;
            enodes.push({ip: element.hostname, port: data.port, pubkey: data['public-key']});
            debug("init -> genesis obteined! write on file:", genesisPath);
            if (utils.fileExistsSync(path.dirname(genesisPath))){
              fs.writeFileSync(genesisPath, JSON.stringify(genesis));
            }else{
              fs.mkdirSync(path.dirname(genesisPath));
              fs.writeFileSync(genesisPath, JSON.stringify(genesis));
            }
            return cb && cb();
          }
        }
        bootRequests(cb);
      });
    }else{
      return cb && cb();
    }
  }

  return new Promise((resolve, reject) => {
    bootRequests(() => {
      debug('path',genesisPath);
      utils.fileExists(genesisPath)
        .then(() => {
          utils.spawn('geth', ['--datadir', db_dir, 'init', genesisPath], (err) => {
            if (!err){
              if (enodes.length > 0){
                let enodesList = enodes.map(function(element){
                  return 'enode://' + element.pubkey + '@' + element.ip + ':' + element.port;
                });
                geth = utils.spawn('geth', [
                  '--datadir',
                  db_dir,
                  '--networkid',
                  genesis.config.chainId,
                  '--bootnodes',
                  enodesList.join(','),
                  '--port',
                  config.GETH_PORT || 30303,
                  '--rpc',
                  '--rpcport',
                  config.RPC_PORT || 8545,
                  '--rpcapi',
                  'web3,eth,net,personal,miner,admin,debug',
                  '--ws',
                  '--wsport',
                  config.WS_RPC_PORT || 8546,
                  '--wsapi',
                  'web3,eth,net,personal,miner,admin,debug',
                  '--wsorigins', '*',
                  // '--rpccorsdomain="*"',
                  '--wsaddr', '127.0.0.1'
                ]);
                setTimeout(function(){
                  resolve(geth);
                }, 3000);
              }
            }else{
              reject('geth error!');
            }
          });
        })
        .catch((err) =>{
          reject("genesis file not found");
        });
    })
  });
}

/**
* Termination function of Ethereum node
* @export terminate
*/
module.exports.terminate = function(){
  geth && geth.kill();
};

process.on('SIGTERM', function() {
  geth && geth.kill();
  process.exit();
});
