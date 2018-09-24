# ETH-VOTING

An experimental voting system basedo on Ethereum blockchain and smart contract.

## Getting Started

This project is composed of 5 subproject:

  - [Bootnode](https://github.com/ClaudioDeMeo/eth-voting/tree/master/bootnode): Ethereum node to which others nodes connect first in order to join the network and find other nodes.
  - [Miner](https://github.com/ClaudioDeMeo/eth-voting/tree/master/miner): Ethereum node that is involved to mining process.
  - [Hub](https://github.com/ClaudioDeMeo/eth-voting/tree/master/hub): Ethereum node to which voters submit their votes and foreward to the smart contract.
  - [Telegram bot](https://github.com/ClaudioDeMeo/eth-voting/tree/master/bot): Telegram Bot that send otp to voters in order to submit their votes.
  - [Voting contract](https://github.com/ClaudioDeMeo/eth-voting/tree/master/voting-contract): Solidity smart contract involved in votes counting.
    - [Endpoint DB](https://github.com/ClaudioDeMeo/eth-voting/tree/master/endpointDB): API that exposes smart contract ABI (Application Binary Interface), candidates and lists model, contract results and other util information.

Each of them can be installed by moving into relative foldering and follow the instruction in the README.

### Prerequisites

Clone the repository:

```
git clone https://github.com/ClaudioDeMeo/eth-voting.git
cd eth-voting
```

###### • Node.js

Each component is written using node.js v10.x (8.x is compatible) so at first you should install Node.js following the instruction descripted at the web page https://nodejs.org/en/download/package-manager:

```
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

###### • Geth

This project needs to run ethereum nodes with geth.
You can install it in Ubuntu by adding the reposotyory:

```
sudo add-apt-repository -y ppa:ethereum/ethereum
```

After that you can install the stable version of Go Ethereum:

```
sudo apt-get update
sudo apt-get install ethereum
```
In particular this project use `geth`, `bootnode` and `solc` of `ethereum suit`.

For other installation see https://ethereum.github.io/go-ethereum/install/.

###### • Yarn (optional)

In this documentation is used `yarn` as an alternative to `npm` I suggest installing yarn package manager but you can use also `npm`.

On Debian or Ubuntu Linux, you can install Yarn via our Debian package repository. You will first need to configure the repository:

```
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
```

Then you can simply:

```
sudo apt-get update && sudo apt-get install yarn
```

## Built With

* [geth](https://geth.ethereum.org/) - Ethereum protocol implementation in go programming language
* [web3.js](https://web3js.readthedocs.io/en/1.0) - Ethereum javascript API
* [telegraf](https://telegraf.js.org/#/) - Telegram bot framework for Node.js
* [plotly.js](https://plot.ly/javascript/) - Javascript Open Source Graphing Library
* [Node.js](https://nodejs.org/en/) - Server implementation
* [Express.js](http://expressjs.com/) - Web app framework for Node.js
* [Socket.io](https://socket.io/) - WebSocket framework for Node.js

## Author

* **Claudio De Meo** - [cdemeo](https://github.com/ClaudioDeMeo)
