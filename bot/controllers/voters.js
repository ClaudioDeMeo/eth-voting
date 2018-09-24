'use strict';

/**
* Voters mongoose Controller
* @module voters
*/

const debug = require('debug')('controllers:voters');
const crypto = require('../lib/crypto');

const Voters = require('../models/voters');

function auth(cf, password){
  return new Promise(function(resolve, reject) {
    Voters.findOne({cf: {$regex: new RegExp(cf,'i')}}, function(err, voter){
      if (err){
        resolve({error: err.code});
      }else if(!voter){
        resolve({error: "Voter not found."});
      }else{
        if (crypto.decrypt(voter.password) == password){
          resolve(voter);
        }else{
          resolve({error: "Wrong pin."});
        }
      }
    })
  });
}

async function find(chatId){
  if (chatId){
    return await Voters.findOne({chatId: chatId});
  }else{
    return new Promise.resolve();
  }
}

async function findByCF(cf){
  if (cf){
    return await Voters.findOne({cf: {$regex: new RegExp(cf,'i')}});
  }else{
    return new Promise.resolve();
  }
}

async function findHub(chatId){
  if (chatId){
    return await Voters.findOne({chatId: chatId}, {hub: 1, _id: 0});
  }else{
    return new Promise.resolve();
  }
}

module.exports = {
  auth: auth,
  find: find,
  findByCF: findByCF,
  findHub: findHub

}
