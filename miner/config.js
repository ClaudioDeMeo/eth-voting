'use strict';

/**
* Configuration module of miner
* @exports config
*/

const path = require('path');
const url = require('url');

module.exports = {

  /** path in which genesis file will be written*/
  GENESIS: path.join(path.resolve(), 'node', 'genesis.json'),

  /** path to blockchain database directory */
  DB_DIR: path.join(path.resolve(), 'node'),

  /** bootnodes interface address */
  BOOTNODE_URL: [url.parse("http://35.178.122.131:8088"), url.parse("http://127.0.0.1:8088")],

  /** Miner http rpc port */
  RPC_PORT: 8545,

  /** Miner ws rpc port */
  WS_RPC_PORT: 8546,

  /** Web API Admin user */
  ADMIN_USER: 'admin',

  /** Web API Admin password */
  ADMIN_PASSWORD: 'admin1234567890',

  /** API http port */
  API_HTTP_PORT: 8080,

  /** API https port */
  API_HTTPS_PORT: 8443,

  /** Geth Network listening port */
  GETH_PORT: 30303,

}
