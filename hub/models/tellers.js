'use strict';

/**
* Tellers mongoose Model
* @module tellers
*/

const debug = require('debug')('models:tellers');
const mongoose = require('mongoose');

var Schema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    index: true,
    sparse: true,
    maxlength: 128,
    trim: true,
    match: new RegExp('\\w+@\\w+\\.\\w{2,4}', 'i'),
    required: true
  },
  password: {
    type: String,
    maxlength: 256,
    required: true
  },
  firstname: {
    type: String,
    maxlength: 128,
    trim: true,
    required: true
  },
  lastname: {
    type: String,
    maxlength: 128,
    trim: true,
    required: true
  },
  docType: {
    type: String,
    enum: ['driving license', 'identity card'],
    default: 'identity card'
  },
  docId: {
    type: String,
    unique: true,
    index: true,
    sparse: true,
    trim: true,
    required: true,
    validate: {
      validator: function(v){
        if (this.docType == 'identity card'){
          return (new RegExp('au\\d{7}|c\\[a-z]{1}\\d{5}\\[a-z]{2}','i').test(v) && v.length == 9);
        }else{
          return (new RegExp('\\[a-z]{2}\\d{7}\\[a-z]{1}').test(v) && v.length == 10);
        }
      },
    }
  },
  cf: {
    type: String,
    unique: true,
    index: true,
    sparse: true,
    trim: true,
    required: true,
    match: new RegExp('[a-z]{6}\\d{2}[abcdehlmprst]\\d{2}[a-z]\\d{3}[a-z]', 'i'),
    maxlength: 16,
    minlength: 16
  },
  hub: {
    type: String,
    required: true
  }
});

module.exports = function(connection){
  return connection.model('Tellers', Schema);
};
