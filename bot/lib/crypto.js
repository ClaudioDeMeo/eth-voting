'use strict';

/**
* Encrypting and Decrypting Module
* @module crypto
*/
const debug = require('debug')('hub:crypto');
const Crypto = require("crypto");
const config = require("../config");

var iv = "0078e1445591726b";

module.exports.encrypt = function(data){
  try {
    const cipher = Crypto.createCipheriv('aes-128-ctr', config.SECRET, iv);
    return cipher.update(data).toString('hex');
  } catch (e) {
    return null;
  }
}

module.exports.decrypt = function(data){
  try {
    const decipher = Crypto.createDecipheriv("aes-128-ctr", config.SECRET, iv);
    return decipher.update(Buffer.from(data, 'hex')).toString();
  } catch (e) {
    return null;
  }
}
