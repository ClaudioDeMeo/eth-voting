'use strict';
/**
* Mongoose rest interfaces
* @module mongoose-rest-api
*/

const debug = require('debug')('hub:mongoose-rest');
const fs = require('fs');
const formidable = require('formidable');
const csv = require('csvtojson');
const utils = require('./utils');
const crypto = require('../lib/crypto');

module.exports.route = function(router, Model){

  var path = "/" + Model.modelName.slice(0, -1);

  function add(entry, cb, finish){
    if (Array.isArray(entry)){
      if (entry[0].password){
        entry[0].password = crypto.encrypt(entry[0].password);
      }
      var model = new Model(entry.shift());
      model.save(function(err, data){
        if (err){
          cb && cb(err);
        }else{
          cb && cb();
        }
        if (entry.length > 0){
          add(entry, cb, finish);
        }else{
          finish && finish();
        }
      });
    }else{
      if (entry.password){
        entry.password = crypto.encrypt(entry.password);
      }
      var model = new Model(entry);
      model.save(function(err, data){
        if (err){
          cb && cb(err);
        }else{
          cb && cb();
        }
      });
    }
  }

  function get(query, cb){
    Object.keys(query).map(function(key){
      query[key] = { '$regex': new RegExp(query[key],'i')};
    });
    Model.find(query, {password: 0, chatId: 0}, function(err, data){
      if (err){
        cb && cb(err);
      }else{
        cb && cb(null, data);
      }
    });
  }

  function remove(ids, cb){
    Model.deleteMany({_id: {'$in': [].concat(ids)}}, function(err){
      if (err){
        cb && cb(err);
      }else{
        cb && cb();
      }
    });
  }

  router.post(path + "s", function(req, res){
    var form = new formidable.IncomingForm();
    var file = null;
    form.encoding = 'utf-8';
    form.keepExtensions = true;
    form.on('file', function(name, data){
      file = data;
    })
    form.on('end', function(){
      csv().fromFile(file.path)
        .then((jsonArray) => {
          var count = 0;
          var total = jsonArray.length;
          add(jsonArray, (err) => {
            if (!err){
              count++;
            }
          }, () => {
            res.json({result: "Ok", inserted: count, discarded: (total - count)});
          });
        })
        .catch((e) => {
          res.json({error: "File parsing error"});
        });
      utils.fileExists(file.path)
        .then(() => {
          fs.unlink(file.path, () =>{});
        })
        .catch(() => {});
    });
    form.on('error', function(err) {
      res.json({error: "File uploading error"});
    });
    form.parse(req);
  });


  router.post(path, function(req, res){
    add(req.body, function(err){
      if (!err){
        res.json({result: "ok"});
      }else{
        if (err.code == 11000){
          res.json({error: "entry already exists"});
        }else{
          res.json({error: "entry not added"});
        }
      }
    });
  });

  router.get(path + "s", function(req, res){
    get(req.query, function(err, data){
      if (!err){
        res.json({result: data});
      }else{
        res.json({error: err});
      }
    });
  });

  router.delete(path + "/:id", function(req, res){
    remove(req.params.id, function(err){
      if (!err){
        res.json({result: "ok"});
      }else{
        res.json({error: err});
      }
    });
  });

  router.post(path + 's/delete', function(req, res){
    remove(req.body.ids, function(err){
      if (!err){
        res.json({result: "ok"});
      }else{
        res.json({error: err});
      }
    });
  });

}
