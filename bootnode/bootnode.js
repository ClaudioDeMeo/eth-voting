'use strict';

/**
* Main module of bootnode
* @module bootnode
*/

const debug = require('debug')('bootnode');
const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('./config');
const child_process = require('child_process');

/** String path to blockchain database direcory */
const db_dir = config.DB_DIR || path.join(path.reolve(), 'node');

/** String path to private key of bootnode */
const bootkey = config.BOOTKEY || path.join(db_dir, 'bootkey.key');

/** Public key string of bootnode */
var pubkey = null;

/** Genesis JSON structure */
var genesis = null;

/** Bootnode process */
var bootnode = null;

if(config.GENESIS){

  /**
   * @function fileExists
   * @param {String} file file to check if exists
   * @returns {Promise} Promise that will be resolved if file exists or rejected
   * if not
   * @description Chack if a file exists
   */
  function fileExists(file){
    return new Promise((resolve, reject) => {
      fs.access(file, fs.constants.F_OK, (err) => {
        if (err){
          reject(err);
        }else{
          resolve(true);
        }
      });
    });
  }

  /**
   * @function readJSONFile
   * @param {String} file file to read
   * @returns {Promise} Promise that will be resolved if the json structure is
   * readed or rejected if there are error
   * @description Read a JSON file
   */
  function readJSONFile(file){
    return new Promise((resolve, reject) => {
      fs.readFile(file, (err, data) => {
        if (err){
          reject(err);
        }else{
          try{
            resolve(JSON.parse(data.toString()))
          }catch(e){
            reject(e);
          }
        }
      });
    });
  }

  /**
   * @function spawn
   * @param {String} process process to spawn
   * @param {Array} arg arguments of the process
   * @returns {ChildProcess} child process spawned
   * @description Spawn a child process
   */
  function spawn(process, arg){
    const child = child_process.spawn(process, arg);

    child.stdout.on('data', (data) => {
      debug(process, 'stderr:', data.toString());
    });

    child.stderr.on('data', (data) => {
      data = data.toString();
      debug(process, 'stdout:', data);
      if (process == 'bootnode'){
        pubkey = data.substr(data.indexOf('enode://') + 8, 128);
      }
    });

    child.on('exit', (code, signal) => {
      if (code === 0 && signal === null && process == 'geth'){
        bootnode && bootnode.kill();
        bootnode = null;
        fileExists(db_dir)
          .then(() => {
            fileExists(bootkey)
              .then(() => {
                debug(process, 'spwn bootnode');
                bootnode = spawn('bootnode', ['--nodekey', bootkey, "--addr", ":" + config.BOOTNODE_PORT]);
              })
              .catch((err) => {
                debug(process, 'private key not found, spawn bootnode to generate key');
                spawn('bootnode', ['--genkey', bootkey]);
              });
          })
          .catch((err) => {
            debug(process, 'db_dir not found: bootnode cann not be initialized');
          });
      }else{
        debug(process, 'exited with code:', code, 'and signal:', signal);
      }
    });

    return child;
  }

  /**
   * @function init
   * @description Initialization function
   */
  function init(){
    fileExists(config.GENESIS)
      .then(() => {
        readJSONFile(config.GENESIS)
          .then((data) => {
            genesis = data;
            spawn('geth', ['--datadir', db_dir, 'init', config.GENESIS]);
          })
          .catch((err) => {
            debug('init -> read file error:', err);
          });
      })
      .catch((err) => {
        debug('init -> access file', config.GENESIS, 'error:', err.code, err.code === 'ENOENT' ? 'does not exist' : 'is not readable');
      });
  }

  init();
  fs.watchFile(config.GENESIS, (curr, prev) => {
    if(curr.mtime != prev.mtime){
      debug('genesis changed: reboot');
      init();
    }
  });

  fs.watchFile(bootkey, (curr, prev) => {
    if(curr.mtime != prev.mtime){
      debug('bootkey changed: reboot');
      fileExists(bootkey)
        .then(() => {
          bootnode && bootnode.kill();
          bootnode = null;
          bootnode = spawn('bootnode', ['--nodekey', bootkey, "--addr", ":" + config.BOOTNODE_PORT]);
        })
        .catch(() => {
          fileExists(db_dir)
            .then(() => {
              spawn('bootnode', ['--genkey', bootkey]);
            })
            .catch(() => {
              spawn('geth', ['--datadir', db_dir, 'init', config.GENESIS]);
            })
        });
    }
  });

}

/** HTTP Server */
const app = express();

//Enable CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/**
 * Interface to get publickey, port of bootnode and genesis file
 * @interface /
 */
app.get('/', (req, res) => {
  res.json({"public-key": pubkey, "port": config.BOOTNODE_PORT, genesis: genesis});
});

/**
 * Interface to get publickey and port of bootnode
 * @interface /enode
 */
app.get('/enode', (req, res) => {
  res.json({"public-key": pubkey, "port": config.BOOTNODE_PORT});
});

/**
 * Interface to get genesis file
 * @interface /genesis
 */
app.get('/genesis', (req, res) => {
  res.json(genesis);
});

app.listen(config.HTTP_PORT,(err) => {
  if (err){
    debug('Error:', err);
    return;
  }
  console.log('server listening on port', config.HTTP_PORT);
});

process.on('SIGTERM', function() {
  bootnode && bootnode.kill();
  process.exit();
});
