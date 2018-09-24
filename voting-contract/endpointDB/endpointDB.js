'use strict';

/**
* Hub main module
* @module endpointDB
*/

const debug = require('debug')('endpoint');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const Web3 = require('web3');
const node = require('./lib/node');

mongoose.set('useCreateIndex', true);
/** MongoDB connection */
mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, reconnectTries: Number.MAX_VALUE}, function(error){

  if (!error){

    var Hub = require('./models/hub');
    var Voter = require('./models/voter');

    var abi = null;
    try {
      abi = JSON.parse(fs.readFileSync(config.VOTING_ABI).toString());
    } catch (e) {
      debug(e);
    }

    var contractData = {};


    var model = JSON.parse(fs.readFileSync(config.VOTING_MODEL).toString());
    var numLists = model.map(function(element){
      return element.lists.length;
    });

    function contractResult(){
      var numCandidates = contractData.numCandidates ? Math.min(contractData.numCandidates, model.length) : null;
      var numWinnerCandidates = (numCandidates && contractData.numWinnerCandidates) ? Math.min(numCandidates, contractData.numWinnerCandidates) : null;
      var winnerCandidateVotes = contractData.candidateVote ? Math.max(...contractData.candidateVote) : null;
      var winnerCandidates = null;
      var numWinnerLists = null;
      var winnerLists = null;
      var candidates = null;
      var lists = null;

      function clean(array){
        var cleaned = [];
        for (var i = 0; i < array.length; i++) {
          if (array[i]){
            cleaned.push(array[i]);
          }
        }
        return cleaned;
      }

      if (contractData.candidateVote){
        winnerCandidates = clean(contractData.candidateVote.map(function(element, index){
          if (element == winnerCandidateVotes){
            return {index: index, candidate: model[index].candidate, votes: winnerCandidateVotes};
          }
        }));
        numWinnerLists = clean(winnerCandidates.map(function(element){
          if (element){
            var winnerListVotes = Math.max(...contractData.listVote[element.index]);
            var lists = contractData.listVote[element.index].map(function(vote, i){
              if (vote == winnerListVotes){
                return i;
              }
            });
            return {candidateIndex: element.index, votes: winnerListVotes, listsIndex: lists, num: lists.length};
          }
        }));
        winnerLists = clean(numWinnerLists.map(function(element){
          if (element){
            var lists = element.listsIndex.map(function(i){
              return {list: model[element.candidateIndex].lists[i], candidateIndex: element.candidateIndex, listIndex: i, votes: element.votes};
            });
            return {lists: lists};
          }
        }));
        candidates = model.map(function(element, index){
          var ret = element.candidate;
          ret.votes = contractData.candidateVote[index];
          return ret;
        });
      }
      if (contractData.listVote){
        lists = model.map(function(element, i){
          var ret = element.lists.map(function(list, k){
            var l = list;
            l.votes = contractData.listVote[i][k];
            l.candidateIndex = i;
            l.listIndex = k;
            return l;
          });
          return ret;
        });
      }
      return {
        numWinnerCandidates: numWinnerCandidates,
        winnerCandidates: winnerCandidates,
        winnerLists: winnerLists,
        candidates: candidates,
        lists: lists
      };
    }

    /** HTTP Server */
    const app = express();

    //Enable CORS
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    //error hendler
    app.use(function(err, req, res, next){
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

    app.use(express.static(path.join(path.resolve(), 'static'), { fallthrough: true }));

    /**
    * Interface to get Hub list from mongo db
    * @interface /
    */
    app.get('/api', (req, res) => {
      // debug("new request")
      Hub.find({},{_id: 0, account: 1},async function(error, hubs){
        if (!error){
          var hubsAddress = hubs.map(function(element){
            return element.account || 0;
          });
          try {
            var numVoters = await Voter.aggregate([
              {
                $group: {
                  _id: "$hub",
                  total: {$sum: 1},
                }
              },
              {
                $project: {_id: 0}
              }
            ]);
          } catch (e) {
            numVoters = 0;
          }
          numVoters = numVoters && numVoters.map(function(element){
            return element.total;
          });
          res.json({
            result: {
              hubsAddress: hubsAddress,
              numVoters: numVoters,
              model: model,
              numCandidates: model.length,
              numLists: numLists,
              abi: abi,
              address: config.CONTRACT_ADDRESS,
              contractResult: contractResult()
            }
          });
        }else{
          res.json({
            result: {
              hubsNames: [],
              hubsAddress: [],
              numVoters: [],
              model: model,
              numCandidates: model.length,
              numLists: numLists,
              abi: abi,
              address: config.CONTRACT_ADDRESS,
              contractResult: contractResult()
            }
          });
        }
      });
    });

    app.get('/', (req, res) => {
      res.sendFile(path.join(path.resolve(), 'static/index.html'));
    });

    app.listen(config.HTTP_PORT || 5000,(err) => {
      if (err){
        debug('Error:', err);
        return;
      }
      console.log('server listening on port', config.HTTP_PORT || 5000);
    });

    var web3 = null;
    var contract = null;

    function callMethod(){
      var args = Array.prototype.slice.call(arguments);
      var cb = null;
      if (typeof args[args.length - 1] == "function"){
        cb = args.pop();
      }
      (args.slice(1).length > 0 ? (args.slice(1).length > 1 ? contract.methods[args[0]](args[1], args[2]) : contract.methods[args[0]](args[1])) : contract.methods[args[0]]())
        .call()
          .then((result)=>{
            cb && cb(null, result);
          }).catch((e)=>{
            debug(args[0], "Error:", e);
            cb && cb(e);
          });
    }

    function initContract(abiInterface, account){
      contract = new web3.eth.Contract(abiInterface, config.CONTRACT_ADDRESS, {
        from: account
      });
      setInterval(function(){
        // debug(contractData)
        web3.eth.personal.unlockAccount(account, config.ACCOUNT_PASS, 3600)
          .then(() => {
            // debug("calling contract", contract.options.address);
            callMethod('getNumCandidates', function(error, result){
              if (!error){
                contractData.numCandidates = result;
              }
            });
            callMethod('getNumWinnerCandidates', function(error, result){
              if (!error){
                contractData.numWinnerCandidates = result;
              }
            });
            callMethod('getWinnerCandidate', function(error, result){
              if (!error){
                contractData.winnerCandidate = result;
              }
            });
            callMethod('getNumWinnerList', function(error, result){
              if (!error){
                contractData.numWinnerList = result;
              }
            });
            callMethod('getWinnerList', function(error, result){
              if (!error){
                contractData.winnerList = result;
              }
            });
            model.forEach(function(candidate, i){
              callMethod('getNumCandidateLists', i, function(error, result){
                if (!error){
                  if (!contractData.numCandidateLists){
                    contractData.numCandidateLists = [];
                  }
                  contractData.numCandidateLists[i] = result;
                }
              });
              callMethod('getCandidateVote', i, function(error, result){
                if (!error){
                  if (!contractData.candidateVote){
                    contractData.candidateVote = [];
                  }
                  contractData.candidateVote[i] = result;
                }
              });
              candidate.lists.forEach(function(list, j){
                callMethod('getListVote', i, j, function(error, result){
                  if (!error){
                    if (!contractData.listVote){
                      contractData.listVote = [];
                    }
                    if (!contractData.listVote[i]){
                      contractData.listVote[i] = [];
                    }
                    contractData.listVote[i][j] = result;
                  }
                });
              });
            });

          })
          .catch((e) => {
            debug(e);
          });
      }, 1000);
    }

    node.init()
      .then((geth, args)=>{
        console.log("Node initialized!");
        web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:' + (config.WS_RPC_PORT || 8546)));
        web3.eth.getAccounts()
          .then((accounts) => {
            if (!accounts || accounts.length == 0){
              web3.eth.personal.newAccount(config.ACCOUNT_PASS)
                .then((account) => {
                  debug("new Account created:", account);
                  initContract(abi, account);
                })
                .catch((error) => {
                  debug(error);
                });
            }else{
              debug("account:", accounts[0])
              initContract(abi, accounts[0]);
            }
          })
          .catch((err) => {
            debug(err);
          });

      }).catch((err)=>{
        console.log("Node error:", err);
      });


  }else{
    console.log("MongoDB connection error:", error);
  }
});
