/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
const { API_URL, API_URL_KOVAN, API_URL_RINKEBY, ETHERSCAN_API_KEY, PRIVATE_KEY } = process.env;
module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  },
   defaultNetwork: "mumbai",
   networks: {
      hardhat: {},
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
     }
   },
   etherscan: {
     apiKey: ETHERSCAN_API_KEY
   }
}