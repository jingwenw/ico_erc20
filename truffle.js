require('babel-register');
require('babel-polyfill');
require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
     kovan: {
      provider: function() {
        return new HDWalletProvider(
          process.env.MNEMONIC,
         `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`
        )
      },
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: 42
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(
	  process.env.MNEMONIC,
          `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`
        )
      },
      gas: 25000000,
      gasPrice: 25000000000,
      network_id: 3
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
