'use strict';

/**
* Utils functions
* @module utils
*/
const debug = require('debug')('endpoint:utils');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const http = require('http');

module.exports = {

  /**
   * @function fileExists
   * @param {String} file file or directory to check if exists
   * @returns {Promise} Promise that will be resolved if file exists or rejected
   * if not
   * @description Chack if a file exists
   */
  fileExists: function(file){
    return new Promise((resolve, reject) => {
      fs.access(file, fs.constants.F_OK, (err) => {
        if (err){
          reject(err);
        }else{
          resolve(true);
        }
      });
    });
  },

  /**
   * @function fileExistsSync
   * @param {String} file file or direcotry to check if exists
   * @returns {Boolean} Return true if exists or false if not
   * @description Chack if a file exists
   */
  fileExistsSync: function(file){
    try {
      fs.accessSync(file, fs.constants.R_OK);
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * @function readJSONFile
   * @param {String} file file to read
   * @returns {Promise} Promise that will be resolved if the json structure is
   * readed or rejected if there are error
   * @description Read a JSON file
   */
  readJSONFile: function(file){
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
  },

  /**
   * @function request
   * @param {String} serverUrl server address
   * @param {String} httpPath request path
   * @param {Boolean} json if true the response is in json format @default false
   * @returns {ChildProcess} child process spawned
   * @description Spawn a child process
   */
   request: function(serverUrl, httpPath, json = false, cb){
       let options = {
         protocol: serverUrl.protocol,
         host: serverUrl.hostname,
         port: serverUrl.port,
         path: httpPath,
       };
       var req = http.get(options, (res) => {
         if (res.statusCode == 200){
           res.setEncoding('utf8');
           var data = '';
           res.on('data', (chunk) => {
             data += chunk;
           });
           res.on('end', ()=>{
             if (json){
               try {
                 cb && cb(JSON.parse(data));
               } catch (e) {
                 cb && cb(data);
               }
             }else{
               cb && cb(data);
             }
           });
         }else{
           cb && cb({error: res.statusCode});
         }
       });
       req.on('error', function(e){
         if(e.code !== "ETIMEDOUT"){
           cb && cb({error: e.code});
         }
       });
       req.setTimeout(3000, function(){
         cb && cb({error: "timeout"})
       });
   },

  /**
   * @function spawn
   * @param {String} process process to spawn
   * @param {Array} arg arguments of the process
   * @returns {ChildProcess} child process spawned
   * @description Spawn a child process
   */
  spawn: function(process, arg, cb){
    debug('spawn process:', process, arg)
    const child = child_process.spawn(process, arg);

    child.stdout.on('data', (data) => {
      debug(process, 'stderr:', data.toString());
    });

    child.stderr.on('data', (data) => {
      debug(process, 'stdout:', data.toString());
    });

    child.on('exit', (code, signal) => {
      debug(process, 'exited with code:', code, 'and signal:', signal);
        if (code === 0 && signal === null){
          cb && cb();
        }else{
          cb && cb({code: code, signal: signal});
        }
    });
    return child;
  },

}
