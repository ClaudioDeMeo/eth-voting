# VOTING CONTRACT

This is Solidity smart contract involved in votes counting.

## Usage

Move into the folder `voting-contract`: `cd voting-contract`.

##### Compile the Contract

```
./compile.sh
```

#### Deploy the contract

Afther compining a file `voting.js` and a `bin` directory are generated.

`voting.js` is the script that contains instructions to deploy the contract using geth.

In the `bin` directory are `ABI` and `Binary` files that you can use to deploy the contract. In particular you have to deploy `voting` contract.

Using geth console you can use `loadScript('voting.js')` to deploy with a funded account.

Note that if there are no miners in the network you have to mine yourself in order to deploy the contract over the network.

After the contract is deployed yo can get contract address typing `voting.address` in geth console.

Now you can use `setNumCandidates` function of the contract to set maximum number of candidates.

Once you get contract address edit `CONTRACT_ADDRESS` field in the `config.js` inside `endpointDB` directory.

## Built With

* [geth](https://geth.ethereum.org/) - Ethereum protocol implementation in go programming language
* [web3.js](https://web3js.readthedocs.io/en/1.0) - Ethereum javascript API
* [Node.js](https://nodejs.org/en/) - Server implementation
* [Express.js](http://expressjs.com/) - Web app framework for Node.js

## Author

* **Claudio De Meo** - [cdemeo](https://github.com/ClaudioDeMeo)
