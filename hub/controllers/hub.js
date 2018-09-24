'use strict';

/**
* Hub mongoose Controller
* @module hub
*/

const debug = require('debug')('controllers:hub');

module.exports = function(connection){
  const Hub = require('../models/hub')(connection);

  function createHub(hubname, pwd, account, cb){
    var hub = new Hub({name: hubname, password: pwd, account, account});
    hub.save(function(err, hub){
      if (err){
        console.log("Error creating hub:", err);
        cb && cb(err)
      }else{
        console.log("Hub created");
        cb && cb();
      }
    });
  }

  function findHub(hubname, cb){
    Hub.find({name: hubname}, function(err, hub){
      if (err){
        cb && cb();
      }else{
        cb && cb(hub);
      }
    });
  }

  function removeHub(hubname, pwd, cb){
    Hub.remove({name: hubname, password: pwd}, function(err){
      if (err){
        cb && cb(false);
      }else{
        cb && cb(true);
      }
    });
  }

  function findByAccount(account, cb){
    Hub.find({account: account}, function(err, hub){
      if (err){
        cb && cb();
      }else{
        cb && cb(hub);
      }
    });
  }

  return {

    create: createHub,

    find: findHub,

    remove: removeHub,

    findByAccount: findByAccount
  };

}
