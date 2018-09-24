'use strict';

/**
* Tellers mongoose Controller
* @module tellers
*/

const debug = require('debug')('controllers:tellers');
const MoongoseRestApi = require('../lib/mongoose-rest-api');
const crypto = require('../lib/crypto');

module.exports = function(connection, app){

  const Tellers = require('../models/tellers')(connection);

  function authTeller(cf, password, cb){
    Tellers.findOne({cf: {$regex: new RegExp(cf,'i')}}, function(err, teller){
      if (err){
        cb && cb(err);
      }else{
        if (teller && crypto.decrypt(teller.password) == password){
          cb && cb(null, true);
        }else{
          cb && cb(null, false);
        }
      }
    });
  }

  function findTeller(cf, cb){
    Tellers.findOne({cf: {$regex: new RegExp(cf,'i')}}, {password: 0}, function(err, teller){
      if (err){
        cb && cb(err);
      }else{
        cb && cb(null, teller);
      }
    });
  }

  app && MoongoseRestApi.route(app, Tellers);

  return {
    auth: authTeller,
    find: findTeller
  };
}
