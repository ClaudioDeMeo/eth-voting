# HUB

Ethereum node to which voters submit their votes and foreward to the smart contract.

Exposes two interface:
- private: in which the administrator of the hub can manage tellers and voters.
- pubblic: in which tellers can abilitate the voters to vote and voters can submit.

## Installation

Move into the folder `hub`: `cd hub`.

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

#### Run Hub

```
yarn hub
```

#### Run in debug mode

```
yarn debug
```

#### Useage

If the installation was successful you can use the hub with graphic interface at the addresses:
- `http://[hub-IP]:[config-HTTPS_PRIVATE_PORT]` for private interface (you can use only the local machine or a plugged Android smartphone)
- `http://[hub-IP]:[config-HTTPS_PUBLIC_PORT]` for public interface.

## Built With

* [geth](https://geth.ethereum.org/) - Ethereum protocol implementation in go programming language
* [web3.js](https://web3js.readthedocs.io/en/1.0) - Ethereum javascript API
* [Node.js](https://nodejs.org/en/) - Server implementation
* [Express.js](http://expressjs.com/) - Web app framework for Node.js
* [Socket.io](https://socket.io/) - WebSocket framework for Node.js

## Author

* **Claudio De Meo** - [cdemeo](https://github.com/ClaudioDeMeo)
