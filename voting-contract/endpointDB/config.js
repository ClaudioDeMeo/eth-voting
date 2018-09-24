'use strict';

/**
* Configuration module of hub
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

  /** Hub http rpc port */
  RPC_PORT: 8549,

  /** Hub ws rpc port */
  WS_RPC_PORT: 8550,

  /** API http server port */
  HTTP_PORT: 8880,

  /** Geth Network listening port */
  GETH_PORT: 30309,

  /** MongoDb URL with Teller (readonly) access */
  MONGO_URL: 'mongodb://teller:teller1234@ds151292.mlab.com:51292/eth-voting',

  /** Voting model path */
  VOTING_MODEL: path.join(path.resolve(), "voting-model.json"),

  /** Voting ABI path */
  VOTING_ABI: path.join(path.resolve().replace('endpointDB', 'bin'), "voting.abi"),

  /** Account Password */
  ACCOUNT_PASS: 'Test1234',

  /** Contract Address */
  CONTRACT_ADDRESS: '0xc0ac8b8181662e9ce5d80d54f18d8b3e47ee955b', //CHANGE ME WITH CONTRACT ADDRESS

}
