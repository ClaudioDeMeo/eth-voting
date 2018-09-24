# MINER

Ethereum node that is involved to mining process. Allow yo to mine new block and transactions in the test network.

## Installation

Move into the folder `miner`: `cd miner`.

#### Create documentation

If you are interested in read documentation install jsdoc: `sudo npm install -g jsdoc` and execute `yarn gendoc`.

#### Generate SSL certificate

```
cd sslcert && ./genchert.sh
```

#### Build the project

```
yarn build
```

#### Edit config file

In `config.js` there are different paramiter that you can edit.

#### Run Miner

```
yarn miner
```

#### Run in debug mode

```
yarn debug
```

#### Useage

If the installation was successful you can use the miner with the graphic interface exposes at the address: `https://[miner-IP]:[config-HTTPS_PORT]` (you can use only the local machine or a plugged Android smartphone).

## Built With

* [geth](https://geth.ethereum.org/) - Ethereum protocol implementation in go programming language
* [web3.js](https://web3js.readthedocs.io/en/1.0) - Ethereum javascript API
* [Node.js](https://nodejs.org/en/) - Server implementation
* [Express.js](http://expressjs.com/) - Web app framework for Node.js
* [Socket.io](https://socket.io/) - WebSocket framework for Node.js

## Author

* **Claudio De Meo** - [cdemeo](https://github.com/ClaudioDeMeo)
