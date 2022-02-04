/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-waffle");
const { API_URL, API_URL_KOVAN, API_URL_RINKEBY, API_URL_POLYGON, POLYSCAN_API_KEY, PRIVATE_KEY, BIDDER1_PRIV, BIDDER2_PRIV, BIDDER3_PRIV, BIDDER4_PRIV } = process.env;
module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
   defaultNetwork: "localhost",
   networks: {
      hardhat: {
        accounts: [
          { privateKey: `0x${PRIVATE_KEY}`, balance: "10000000000000000000000"},
          { privateKey: `0x${BIDDER1_PRIV}`, balance: "10000000000000000000000"},
          { privateKey: `0x${BIDDER2_PRIV}`, balance: "10000000000000000000000"},
          { privateKey: `0x${BIDDER3_PRIV}`, balance: "10000000000000000000000"},
          { privateKey: `0x${BIDDER4_PRIV}`, balance: "10000000000000000000000"}
        ],
        forking: {
          url: API_URL_POLYGON,
          blockNumber: 24469749  // assumes polygon fork
        },
        timeout: 240000,
        loggingEnabled: true,
        gasMultiplier: 5,
        gasPrice: 1000000000 * 7
      },
      kovan: {
         url: API_URL_KOVAN,
         accounts: [`0x${PRIVATE_KEY}`],
         gasMultiplier: 3,
         gasPrice: 1000000000 * 2
      },
      rinkeby: {
        url: API_URL_RINKEBY,
        accounts: [`0x${PRIVATE_KEY}`],
        gasMultiplier: 4,
        gasPrice: 1000000000 * 6
     },
      mumbai: {
          url: API_URL,
          accounts: [`0x${PRIVATE_KEY}`],
          gasMultiplier: 3,
          gasPrice: 1000000000 * 2
      },
      polygon: {
          url: API_URL_POLYGON,
          accounts: [`0x${PRIVATE_KEY}`],
          gasMultiplier: 3,
          gasPrice: 1000000000 * 2
      }
   },
   etherscan: {
     apiKey: POLYSCAN_API_KEY
   }
}

// npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS
// npx hardhat node --fork https://polygon-mainnet.g.alchemy.com/v2/zdeZwAwHBiBZzLtxdWtShZzuAjBPjoUW --fork-block-number 24390154
// 