'use strict';

/**
* Hub mongoose Model
* @module hub
*/

const debug = require('debug')('models:hub');
const mongoose = require('mongoose');

var hubSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    sparse: true,
    required: true,
    maxlength: 256,
    unique: true
  },
  password: {
    type: String,
    maxlength: 256,
    required: true
  },
  account: String
});


module.exports = mongoose.model('Hub', hubSchema);
