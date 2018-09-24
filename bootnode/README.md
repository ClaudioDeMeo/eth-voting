# BOOTNODE

This is the nodes to which others nodes connect first in order to join the network and find other nodes.

Exposes via http the `public key` and the `port` to connect and the `genesis.json` file to initialize the network.

## Installation

Move into the folder `bootnode`: `cd bootnode`.

#### Create documentation

If you are interested in read documentation install jsdoc: `sudo npm install -g jsdoc` and execute `yarn gendoc`.

#### Build the project

```
yarn build
```

#### Edit config file

In `config.js` there are different paramiter that you can edit as HTTP port of API.

#### Run Bootnode

```
yarn bootnode
```

#### Run in debug mode

```
yarn debug
```

#### Useage

If the installation was successful you can find the information to connect to the bootnode at the address: `http://[bootnode-IP]:[config-HTTP_PORT]`.

## Built With

* [geth](https://geth.ethereum.org/) - Ethereum protocol implementation in go programming language
* [Node.js](https://nodejs.org/en/) - Server implementation
* [Express.js](http://expressjs.com/) - Web app framework for Node.js

## Author

* **Claudio De Meo** - [cdemeo](https://github.com/ClaudioDeMeo)
