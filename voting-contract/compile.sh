#!/bin/bash

rm -rf bin voting.js
solc -o ./bin --bin --abi voting.sol
echo "var votingContract = eth.contract($(<bin/voting.abi))" >> voting.js
echo "personal.unlockAccount(eth.accounts[0])" >> voting.js
echo "var voting = votingContract.new({from: eth.accounts[0], data: '0x$(<bin/voting.bin)', gas: 4712388})" >> voting.js
