'use strict';

/**
* Voters mongoose Model
* @module voters
*/

const debug = require('debug')('models:voters');
const mongoose = require('mongoose');

var Schema = new mongoose.Schema({
  secret:{
    type: String
  },
  password: {
    type: String,
    required: true
  },
  chatId: {
    type: String,
    maxlength: 10,
    minlength: 5,
    index: true,
    unique: true,
    sparse: true,
    trim: true,
    // default: null
  },
  firstname: {
    type: String,
    maxlength: 128,
    index: true,
    sparse: true,
    trim: true,
    required: true
  },
  lastname: {
    type: String,
    maxlength: 128,
    index: true,
    sparse: true,
    trim: true,
    required: true
  },
  docType: {
    type: String,
    required: true,
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
  address: {
    type: String
  },
  number: {
    type: String
  },
  city: {
    type: String,
    maxlength: 128
  },
  cap: {
    type: String,
    match: new RegExp('\\d{5}', 'i'),
    maxlength: 5,
    minlength: 5
  },
  province: {
    type: String,
    maxlength: 128
  },
  hub: {
    type: String,
    required: true
  },
  birthDay: {
    type: Date
  },
  birthPlace: {
    type: String,
    maxlength: 128
  },
  birthProvince: {
    type: String,
    maxlength: 128
  },
  voted: {
    type: Boolean,
    default: false
  }
});

module.exports = function(connection){
  return connection.model('Voters', Schema);
};
