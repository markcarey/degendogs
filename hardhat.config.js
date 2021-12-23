/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
<<<<<<< Updated upstream
const { API_URL, API_URL_KOVAN, PRIVATE_KEY } = process.env;
=======
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");
const { API_URL, API_URL_KOVAN, API_URL_RINKEBY, ETHERSCAN_API_KEY, PRIVATE_KEY } = process.env;
>>>>>>> Stashed changes
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
      mumbai: {
        url: API_URL,
        accounts: [`0x${PRIVATE_KEY}`],
        gasMultiplier: 3,
        gasPrice: 1000000000 * 2
     }
   },
}