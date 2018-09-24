'use strict';

/**
* Voters mongoose Controller
* @module voters
*/

const debug = require('debug')('controllers:voters');
const crypto = require('crypto');
const qrcode = require('qrcode');
const otplib = require('otplib');
const config = require('../config');
const MoongoseRestApi = require('../lib/mongoose-rest-api');

otplib.authenticator.options = { crypto: crypto, step: config.OTPSTEP };

module.exports = function(connection, app){
  const Voters = require('../models/voters')(connection);

  async function stats(hub){
    return await Voters.aggregate([
      {
        $match: {
          hub: hub
        }
      },
      {
        $group: {
          _id: null,
          total: {$sum: 1},
          voted: {$sum: {
            $cond: ['$voted', 1, 0]
          }},
          notVoted: {$sum: {
            $cond: ['$voted', 0, 1]
          }},
        }
      },
      {
        $project: {_id: 0}
      }
    ]);
  }

  async function chatId(id){
    return await Voters.findById(id,{_id: 0, chatId: 1, voted: 1});
  }

  function voted(id){
    return new Promise(function(resolve, reject) {
      Voters.findById(id, function(err, voter){
        if (err){
          resolve({error: err.code});
        }else if (voter && voter.cf){
          if (!voter.voted){
            voter.voted = true;
            voted.secret = null;
            voter.save(function(err, newVoter){
              if (err){
                resolve({error: err.code});
              }else{
                resolve({result: "voted"});
              }
            });
          }else{
            resolve({error: "Already voted"});
          }
        }else{
          resolve({error: "Not found"});
        }
      });
    });
  }

  function generateOTP(id){
    return new Promise(function(resolve, reject) {
      Voters.findById(id, function(err, voter){
        if (err || !voter){
          reject("Voter not found.");
        }else{
          voter.secret = otplib.authenticator.generateSecret();
          voter.save(function(err, newVoter){
            if (!err || !newVoter.secret){
              var token = otplib.authenticator.generate(newVoter.secret);
              qrcode.toDataURL(id + ":" + token, (err, imageUrl) => {
                if (err) {
                  reject("Error generating QRcode");
                }else{
                  resolve(new Buffer(imageUrl.substring(imageUrl.indexOf(',') + 1), 'base64'));
                }
              });
            }else{
              reject("Secret not created");
            }
          });
        }
      });
    });
  }

  function authOtp(id, token){
    return new Promise(function(resolve, reject) {
      Voters.findById(id, function(err, voter){
        if (err || ! voter){
          reject("Voter not found.");
        }else{
          if (voter.secret && !voter.voted){
            resolve({
              auth: otplib.authenticator.check(token, voter.secret),
              time_used: otplib.authenticator.timeUsed(),
              time_remaining: otplib.authenticator.timeRemaining()
            });
          }else{
            resolve({
              auth: false,
              time_used: otplib.authenticator.timeUsed(),
              time_remaining: otplib.authenticator.timeRemaining()
            });
          }
        }
      })
    });
  }

  app && MoongoseRestApi.route(app, Voters);

  return {
    getStats: stats,
    getChatId: chatId,
    setVoted: voted,
    generateOTP: generateOTP,
    authOtp: authOtp
  }
}
