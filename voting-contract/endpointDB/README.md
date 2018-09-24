# ENDPOINT DB

This is the API that exposes smart contract ABI (Application Binary Interface), candidates and lists model, contract results and other util information.
This is

## Installation

Move into the folder `endpointDB`: `cd voting-contract/bootnode`.

#### Create documentation

If you are interested in read documentation install jsdoc: `sudo npm install -g jsdoc` and execute `yarn gendoc`.

#### Build the project

```
yarn build
```

#### Edit config file

In `config.js` there are different paramiter that you can edit as HTTP port of API.

In particular remember to edit `CONTRACT_ADDRESS` field with the correct contract address.

#### Run endpointDB

```
yarn endpointDB
```

#### Run in debug mode

```
yarn debug
```

#### Useage

If the installation was successful you can find the information exposes by the endpoint at the address: `http://[endpointDB-IP]:[config-HTTP_PORT]/api`.

And you can see in grafical rappresentation about the result of the contract ad the address: `http://[endpointDB-IP]:[config-HTTP_PORT]`.

## Built With

* [plotly.js](https://plot.ly/javascript/) - Javascript Open Source Graphing Library
* [geth](https://geth.ethereum.org/) - Ethereum protocol implementation in go programming language
* [web3.js](https://web3js.readthedocs.io/en/1.0) - Ethereum javascript API
* [Node.js](https://nodejs.org/en/) - Server implementation
* [Express.js](http://expressjs.com/) - Web app framework for Node.js

## Author

* **Claudio De Meo** - [cdemeo](https://github.com/ClaudioDeMeo)
