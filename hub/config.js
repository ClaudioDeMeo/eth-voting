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
  RPC_PORT: 8547,

  /** Hub ws rpc port */
  WS_RPC_PORT: 8548,

  /** Web API Admin user */
  ADMIN_USER: 'admin',

  /** Web API Admin password */
  ADMIN_PASSWORD: 'admin1234567890',

  /** API http private server port */
  API_HTTP_PRIVATE_PORT: 8081,

  /** API https private server port */
  API_HTTPS_PRIVATE_PORT: 8444,

  /** API http public server port */
  API_HTTP_PUBLIC_PORT: 8180,

  /** API https public server port */
  API_HTTPS_PUBLIC_PORT: 8543,

  /** Geth Network listening port */
  GETH_PORT: 30304,

  /** MongoDb URL with Hub access*/
  MONGO_HUB_URL: 'mongodb://hub:hub1234@ds151292.mlab.com:51292/eth-voting',

  /** MongoDb URL with Teller access*/
  MONGO_TELLER_URL: 'mongodb://teller:teller1234@ds151292.mlab.com:51292/eth-voting',

  /** Crypto Secret */
  SECRET: 'secret1234567890',

  /** Telegram Bot Token */
  TELEGRAM_TOKEN: '*********************************************',  //CHANGE ME WITH TELEGRAM TOKEN

  /** OTP step */
  OTPSTEP: 300,

  /** EndpointDb address */
  ENDPOINT: url.parse("http://127.0.0.1:8880"),

}
//35.178.122.131
