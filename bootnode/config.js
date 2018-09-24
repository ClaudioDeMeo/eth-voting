'use strict';

/**
* Configuration module of bootnode
* @exports config
*/

const path = require('path');

module.exports = {

  /** path to genesis file */
  GENESIS: path.join(path.resolve(), 'genesis.json'),

  /** path to blockchain database directory */
  DB_DIR: path.join(path.resolve(), 'node'),

  /** path to private key for bootnode */
  BOOTKEY: path.join(path.resolve(), 'node', 'bootkey.key'),

  /** http port */
  HTTP_PORT : 8088,

  /** bootnode port */
  BOOTNODE_PORT : 30301

}
