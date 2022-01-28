/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-waffle");
const { API_URL, API_URL_KOVAN, API_URL_RINKEBY, API_URL_POLYGON, POLYSCAN_API_KEY, PRIVATE_KEY } = process.env;
module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2
      }
    }
  },
   defaultNetwork: "mumbai",
   networks: {
      hardhat: {
        accounts: [{ privateKey: `0x${PRIVATE_KEY}`, balance: "10000000000000000000000"}],
        forking: {
          url: API_URL_POLYGON,
          //blockNumber: 23267191  // assumes polygon fork
        },
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