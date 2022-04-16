const { expect } = require("chai");
const { ethers } = require("hardhat");

const networkName = hre.network.name;
console.log(networkName);
return;

require('dotenv').config();
var BN = web3.utils.BN;
const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DEPLOYER_ADDR = process.env.DEPLOYER_ADDR;
const DEPLOYER_PRIV = process.env.DEPLOYER_PRIV;
var biddersPriv = [
  PRIVATE_KEY,
  process.env.BIDDER1_PRIV,
  process.env.BIDDER2_PRIV,
  process.env.BIDDER3_PRIV,
  process.env.BIDDER4_PRIV
];
var biddersPub = [
  PUBLIC_KEY,
  process.env.BIDDER1_PUB,
  process.env.BIDDER2_PUB,
  process.env.BIDDER3_PUB,
  process.env.BIDDER4_PUB
];

const MANAGER = web3.utils.keccak256("MANAGER_ROLE");
const LAUNCHER = web3.utils.keccak256("LAUNCHER_ROLE");

const dogJSON = require("../artifacts/contracts/Dog.sol/Dog.json");
const houseJSON = require("../artifacts/contracts/DogsAuctionHouse.sol/DogsAuctionHouse.json");
const govJSON = require("../artifacts/contracts/governance/DegenDAOLogicV1.sol/DegenDAOLogicV1.json");

const newContractHash = "bafkreidgmzjyncpofwxiqnaod7pfdwuhmoakuwsenr54dx4xp32ewy5y6y";
const newMetaHash = "bafkreifq7jr7qprkodhdkhcuodo3ht4rn7oy362abpd4ercmqf5synhwtq";
const newBaseURI = "https://degendogs.club/metadata/new/";
const newReserveDuration = 60*60*24*7*8;
const newDonationPercentage = 5;

var lastId = 0;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

function encodeParameters(types, values) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
};

function commaify(nStr) { nStr += ''; x = nStr.split('.'); x1 = x[0]; x2 = x.length > 1 ? '.' + x[1] : ''; var rgx = /(\d+)(\d{3})/; while (rgx.test(x1)) { x1 = x1.replace(rgx, '$1' + ',' + '$2'); } return x1 + x2; }

const signer = new ethers.Wallet(DEPLOYER_PRIV, ethers.provider);
const signers = [
  new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider),
  new ethers.Wallet(process.env.BIDDER1_PRIV, ethers.provider),
  new ethers.Wallet(process.env.BIDDER2_PRIV, ethers.provider),
  new ethers.Wallet(process.env.BIDDER3_PRIV, ethers.provider),
  new ethers.Wallet(process.env.BIDDER4_PRIV, ethers.provider)
];

var network;

var ERC20abi = [
  {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [
          {
              "name": "",
              "type": "string"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_spender",
              "type": "address"
          },
          {
              "name": "_value",
              "type": "uint256"
          }
      ],
      "name": "approve",
      "outputs": [
          {
              "name": "",
              "type": "bool"
          }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_from",
              "type": "address"
          },
          {
              "name": "_to",
              "type": "address"
          },
          {
              "name": "_value",
              "type": "uint256"
          }
      ],
      "name": "transferFrom",
      "outputs": [
          {
              "name": "",
              "type": "bool"
          }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [
          {
              "name": "",
              "type": "uint8"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [
          {
              "name": "_owner",
              "type": "address"
          }
      ],
      "name": "balanceOf",
      "outputs": [
          {
              "name": "balance",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [
          {
              "name": "",
              "type": "string"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_to",
              "type": "address"
          },
          {
              "name": "_value",
              "type": "uint256"
          }
      ],
      "name": "transfer",
      "outputs": [
          {
              "name": "",
              "type": "bool"
          }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [
          {
              "name": "_owner",
              "type": "address"
          },
          {
              "name": "_spender",
              "type": "address"
          }
      ],
      "name": "allowance",
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "name": "owner",
              "type": "address"
          },
          {
              "indexed": true,
              "name": "spender",
              "type": "address"
          },
          {
              "indexed": false,
              "name": "value",
              "type": "uint256"
          }
      ],
      "name": "Approval",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "name": "from",
              "type": "address"
          },
          {
              "indexed": true,
              "name": "to",
              "type": "address"
          },
          {
              "indexed": false,
              "name": "value",
              "type": "uint256"
          }
      ],
      "name": "Transfer",
      "type": "event"
  }
];

var sTokenABI = [{"inputs":[{"internalType":"contract ISuperfluid","name":"host","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"agreementClass","type":"address"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"bytes","name":"state","type":"bytes"}],"name":"AgreementAccountStateUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"agreementClass","type":"address"},{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":false,"internalType":"bytes32[]","name":"data","type":"bytes32[]"}],"name":"AgreementCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"agreementClass","type":"address"},{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"address","name":"penaltyAccount","type":"address"},{"indexed":true,"internalType":"address","name":"rewardAccount","type":"address"},{"indexed":false,"internalType":"uint256","name":"rewardAmount","type":"uint256"}],"name":"AgreementLiquidated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"liquidatorAccount","type":"address"},{"indexed":true,"internalType":"address","name":"agreementClass","type":"address"},{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"address","name":"penaltyAccount","type":"address"},{"indexed":true,"internalType":"address","name":"bondAccount","type":"address"},{"indexed":false,"internalType":"uint256","name":"rewardAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"bailoutAmount","type":"uint256"}],"name":"AgreementLiquidatedBy","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"agreementClass","type":"address"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"slotId","type":"uint256"}],"name":"AgreementStateUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"agreementClass","type":"address"},{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"}],"name":"AgreementTerminated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"agreementClass","type":"address"},{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":false,"internalType":"bytes32[]","name":"data","type":"bytes32[]"}],"name":"AgreementUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"tokenHolder","type":"address"}],"name":"AuthorizedOperator","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"bailoutAccount","type":"address"},{"indexed":false,"internalType":"uint256","name":"bailoutAmount","type":"uint256"}],"name":"Bailout","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"operatorData","type":"bytes"}],"name":"Burned","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"uuid","type":"bytes32"},{"indexed":false,"internalType":"address","name":"codeAddress","type":"address"}],"name":"CodeUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"operatorData","type":"bytes"}],"name":"Minted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"tokenHolder","type":"address"}],"name":"RevokedOperator","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"operatorData","type":"bytes"}],"name":"Sent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokenDowngraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokenUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"}],"name":"authorizeOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"},{"internalType":"bytes32[]","name":"data","type":"bytes32[]"}],"name":"createAgreement","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"defaultOperators","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"downgrade","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"getAccountActiveAgreements","outputs":[{"internalType":"contract ISuperAgreement[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"agreementClass","type":"address"},{"internalType":"bytes32","name":"id","type":"bytes32"},{"internalType":"uint256","name":"dataLength","type":"uint256"}],"name":"getAgreementData","outputs":[{"internalType":"bytes32[]","name":"data","type":"bytes32[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"agreementClass","type":"address"},{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"slotId","type":"uint256"},{"internalType":"uint256","name":"dataLength","type":"uint256"}],"name":"getAgreementStateSlot","outputs":[{"internalType":"bytes32[]","name":"slotData","type":"bytes32[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCodeAddress","outputs":[{"internalType":"address","name":"codeAddress","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getHost","outputs":[{"internalType":"address","name":"host","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUnderlyingToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"granularity","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"underlyingToken","type":"address"},{"internalType":"uint8","name":"underlyingDecimals","type":"uint8"},{"internalType":"string","name":"n","type":"string"},{"internalType":"string","name":"s","type":"string"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"isAccountCritical","outputs":[{"internalType":"bool","name":"isCritical","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isAccountCriticalNow","outputs":[{"internalType":"bool","name":"isCritical","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"isAccountSolvent","outputs":[{"internalType":"bool","name":"isSolvent","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isAccountSolventNow","outputs":[{"internalType":"bool","name":"isSolvent","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"address","name":"tokenHolder","type":"address"}],"name":"isOperatorFor","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"},{"internalType":"address","name":"liquidator","type":"address"},{"internalType":"address","name":"penaltyAccount","type":"address"},{"internalType":"uint256","name":"rewardAmount","type":"uint256"},{"internalType":"uint256","name":"bailoutAmount","type":"uint256"}],"name":"makeLiquidationPayouts","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"operationApprove","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"operationDowngrade","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"operationTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"operationUpgrade","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"operatorData","type":"bytes"}],"name":"operatorBurn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"operatorData","type":"bytes"}],"name":"operatorSend","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"realtimeBalanceOf","outputs":[{"internalType":"int256","name":"availableBalance","type":"int256"},{"internalType":"uint256","name":"deposit","type":"uint256"},{"internalType":"uint256","name":"owedDeposit","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"realtimeBalanceOfNow","outputs":[{"internalType":"int256","name":"availableBalance","type":"int256"},{"internalType":"uint256","name":"deposit","type":"uint256"},{"internalType":"uint256","name":"owedDeposit","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"}],"name":"revokeOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"userData","type":"bytes"}],"name":"selfBurn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"userData","type":"bytes"}],"name":"selfMint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"send","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"int256","name":"delta","type":"int256"}],"name":"settleBalance","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"},{"internalType":"uint256","name":"dataLength","type":"uint256"}],"name":"terminateAgreement","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"}],"name":"transferAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"holder","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"},{"internalType":"bytes32[]","name":"data","type":"bytes32[]"}],"name":"updateAgreementData","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"slotId","type":"uint256"},{"internalType":"bytes32[]","name":"slotData","type":"bytes32[]"}],"name":"updateAgreementStateSlot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newAddress","type":"address"}],"name":"updateCode","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"upgrade","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"}];

var iTokenABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"target","type":"address"},{"indexed":true,"internalType":"address","name":"initiator","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"premium","type":"uint256"}],"name":"FlashLoan","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"PauserAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"PauserRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_rebalancer","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"Rebalance","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"},{"indexed":false,"internalType":"address","name":"_ref","type":"address"}],"name":"Referral","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"constant":true,"inputs":[],"name":"COMP","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"IDLE","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addPauser","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allAvailableTokens","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"fee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"feeAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"flashFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"contract IERC3156FlashBorrower","name":"_receiver","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes","name":"_params","type":"bytes"}],"name":"flashLoan","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"flashLoanFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getAPRs","outputs":[{"internalType":"address[]","name":"","type":"address[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getAllAvailableTokens","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getAllocations","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getAvgAPR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getGovTokens","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"_usr","type":"address"}],"name":"getGovTokensAmounts","outputs":[{"internalType":"uint256[]","name":"_amounts","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"_protocolToken","type":"address"}],"name":"getProtocolTokenToGov","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"govTokens","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"govTokensIndexes","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"govTokensLastBalances","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"gst2","outputs":[{"internalType":"contract GasToken","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"idleController","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint8","name":"decimals","type":"uint8"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isPauser","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isRiskAdjusted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"lastAllocations","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lastITokenPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"maxFlashLoan","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maxUnlentPerc","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bool","name":"","type":"bool"},{"internalType":"address","name":"_referral","type":"address"}],"name":"mintIdleToken","outputs":[{"internalType":"uint256","name":"mintedTokens","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"oracle","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"protocolWrappers","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"rebalance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"rebalancer","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"redeemIdleToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bool[]","name":"_skipGovTokenRedeem","type":"bool[]"}],"name":"redeemIdleTokenSkipGov","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"redeemInterestBearingTokens","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"renouncePauser","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_aToken","type":"address"}],"name":"setAToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address[]","name":"protocolTokens","type":"address[]"},{"internalType":"address[]","name":"wrappers","type":"address[]"},{"internalType":"address[]","name":"_newGovTokens","type":"address[]"},{"internalType":"address[]","name":"_newGovTokensEqualLen","type":"address[]"}],"name":"setAllAvailableTokensAndWrappers","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256[]","name":"_allocations","type":"uint256[]"}],"name":"setAllocations","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_cToken","type":"address"}],"name":"setCToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_fee","type":"uint256"}],"name":"setFee","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeAddress","type":"address"}],"name":"setFeeAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_perc","type":"uint256"}],"name":"setMaxUnlentPerc","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_oracle","type":"address"}],"name":"setOracleAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_rebalancer","type":"address"}],"name":"setRebalancer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_tokenHelper","type":"address"}],"name":"setTokenHelper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"stkAAVE","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenHelper","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"tokenPriceWithFee","outputs":[{"internalType":"uint256","name":"priceWFee","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userAvgPrices","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"usersGovTokensIndexes","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];

var addr = {};
var chain = "polygon";
if (chain == "polygon") {
  addr.vestorFactory = "0x70210B719b90BcA3D81cb8026BFC8677F65EB1d7"; // polygon mainnet
  addr.vestor = "0xdbdF8EA5C514bd1ca8A294a1e6C361502592E457"; // localhost:polygon
  addr.donation = "0x22B5CD016C8D9c6aC5338Cc08174a7FA824Bc5E4"; // polygon --> Unchain Ukraine
  addr.unchain = "0xb37b3b78022E6964fe80030C9161525880274010"; // polygon gnosis safe for Unchain Ukraine
  addr.WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // polygon
  addr.idleWETH = "0xfdA25D931258Df948ffecb66b5518299Df6527C4"; // polygon
  addr.idleWETHx = "0xEB5748f9798B11aF79F892F344F585E3a88aA784"; // polygon
  addr.dogMaster = process.env.DOGMASTER;
  addr.dogBot = "0xFe341be90f9c2Cc7e65Ef4e820f632aB6495b85E";
  addr.SuperHost = "0x3E14dC1b13c488a8d5D310918780c983bD5982E7";
  addr.cfa = "0x6EeE6060f715257b970700bc2656De21dEdF074C";
}
if (chain == "mumbai") {
  //Mumbai:
  addr.vestorFactory = "0xeb45B0eB67a4733E36c4d2aC55554EdF7e156dac";
  addr.vestor = "0xd718d66D0917f80Af45dC13d58001541FB865FCe"; // mumbai for mock idleWETH
  addr.donation = "0x4C30BBf9b39679e6Df06b444435f4b75CF20603e"; // mumbai: Ukraine.sol
  addr.unchain = "0xb37b3b78022E6964fe80030C9161525880274010"; // polygon gnosis safe for Unchain Ukraine
  addr.WETH = "0x3C68CE8504087f89c640D02d133646d98e64ddd9"; 
  addr.idleWETH = "0x490B8896ff200D32a100A05B7c0507E492938BBb"; // MOCK
  addr.idleWETHx = "0x0CCe2C9980711ddc5AA725AF68A10960E49Fd2Ed"; // wrap of MOCK
  addr.dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // use for Mumbai only
  addr.dogBot = "0xFe341be90f9c2Cc7e65Ef4e820f632aB6495b85E";
  addr.SuperHost = "0xEB796bdb90fFA0f28255275e16936D25d3418603";
  addr.cfa = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873";
}

var myDog, auctionHouse, myExec, myLogic, myProxy, vestor, iToken, sToken, sBalStart, weth, lastAuctionStart, gov;
var chainTime;
var ah = [];

// Dog Settings
const name = "Degen Dogs";
const symbol = "DOG";
const baseURI = "https://api.degendogs.club/meta/";

// Auction Settings
const minBid = "50000000000000000";
const timeBuffer = 60*5; // popcorn bidding: 5 minutes
const percentageBidIncrement = 10;
const duration = 60*60*24; // 24 hours
const bidTokenName = "Dog Biscuits";
const bidTokenSymbol = "BSCT";

// Governance Settings
var polygonBlocksPerDay = 38000;
var votePeriod = polygonBlocksPerDay * 7;  // blocks --- ~7 days
var voteDelay = 1; // blocks --- allow votes immediately after proposal submitted
var proposalThresholdPct = 25; // 0.25%
var quorumPct = 2000;  // 20%
var timelockDelay = 60 * 60 * 24 * 2; // Default: 2 days

const debug = true;
const logOutput = false;
var logs = [];
function log(msg, data) {
  logs.push(msg);
  if (data) {
      logs.push(data);
  }
  if (debug) {
      console.log(msg, data);
  }
}

describe("Setup and Contract Config", function () {

before('Deploy Contracts', async function () {
    // runs once before the first test in this block
    this.timeout(2400000);
    network = await ethers.provider.getNetwork();
    log(network.chainId);
    const Dog = await ethers.getContractFactory("Dog");
    const House = await ethers.getContractFactory("DogsAuctionHouse");
    const Exec = await ethers.getContractFactory("DegenDAOExecutor");
    const Logic = await ethers.getContractFactory("DegenDAOLogicV1");
    const Proxy = await ethers.getContractFactory("DegenDAOProxy");

    const vestorFactoryABI = [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "_contract",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "VestorCreated",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "addUser",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "allVestors",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_token",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_host",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_cfa",
            "type": "address"
          }
        ],
        "name": "createVestor",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getAllVestors",
        "outputs": [
          {
            "internalType": "address[]",
            "name": "",
            "type": "address[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "getVestorsForUser",
        "outputs": [
          {
            "internalType": "address[]",
            "name": "",
            "type": "address[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    const vestorABI = [
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "flowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "int96",
            "name": "flowRate",
            "type": "int96"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "permanent",
            "type": "bool"
          },
          {
            "indexed": false,
            "internalType": "enum TokenVestor.FlowState",
            "name": "state",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "cliffEnd",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "vestingDuration",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "starttime",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "cliffAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bytes32",
            "name": "ref",
            "type": "bytes32"
          }
        ],
        "name": "FlowCreated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "flowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "int96",
            "name": "flowRate",
            "type": "int96"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "permanent",
            "type": "bool"
          },
          {
            "indexed": false,
            "internalType": "enum TokenVestor.FlowState",
            "name": "state",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "cliffEnd",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "vestingDuration",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "starttime",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "cliffAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bytes32",
            "name": "ref",
            "type": "bytes32"
          }
        ],
        "name": "FlowStarted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "flowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "int96",
            "name": "flowRate",
            "type": "int96"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "permanent",
            "type": "bool"
          },
          {
            "indexed": false,
            "internalType": "enum TokenVestor.FlowState",
            "name": "state",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "cliffEnd",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "vestingDuration",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "starttime",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "cliffAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bytes32",
            "name": "ref",
            "type": "bytes32"
          }
        ],
        "name": "FlowStopped",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          },
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "previousAdminRole",
            "type": "bytes32"
          },
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "newAdminRole",
            "type": "bytes32"
          }
        ],
        "name": "RoleAdminChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "sender",
            "type": "address"
          }
        ],
        "name": "RoleGranted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "sender",
            "type": "address"
          }
        ],
        "name": "RoleRevoked",
        "type": "event"
      },
      {
        "inputs": [],
        "name": "CLOSER",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "DEFAULT_ADMIN_ROLE",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "GRANTOR",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "LAUNCHER",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "MANAGER",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "acceptedToken",
        "outputs": [
          {
            "internalType": "contract ISuperToken",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "adr",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "flowIndex",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "ref",
            "type": "bytes32"
          }
        ],
        "name": "addRef",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "cfaV1",
        "outputs": [
          {
            "internalType": "contract ISuperfluid",
            "name": "host",
            "type": "address"
          },
          {
            "internalType": "contract IConstantFlowAgreementV1",
            "name": "cfa",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "closeReady",
        "outputs": [
          {
            "internalType": "bool",
            "name": "canExec",
            "type": "bool"
          },
          {
            "internalType": "bytes",
            "name": "execPayload",
            "type": "bytes"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "flowIndex",
            "type": "uint256"
          }
        ],
        "name": "closeStream",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address[]",
            "name": "targetAddresses",
            "type": "address[]"
          }
        ],
        "name": "closeVesting",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "addr",
            "type": "address"
          }
        ],
        "name": "closeVestingForAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "contract IERC20",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "flowIndex",
            "type": "uint256"
          }
        ],
        "name": "elapsedTime",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "flowTokenBalance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getAllAddresses",
        "outputs": [
          {
            "internalType": "address[]",
            "name": "",
            "type": "address[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "start",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "length",
            "type": "uint256"
          }
        ],
        "name": "getAllAddressesPaginated",
        "outputs": [
          {
            "internalType": "address[]",
            "name": "recipients",
            "type": "address[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "adr",
            "type": "address"
          }
        ],
        "name": "getFlowCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "adr",
            "type": "address"
          }
        ],
        "name": "getFlowRecipient",
        "outputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "int96",
                "name": "flowRate",
                "type": "int96"
              },
              {
                "internalType": "bool",
                "name": "permanent",
                "type": "bool"
              },
              {
                "internalType": "enum TokenVestor.FlowState",
                "name": "state",
                "type": "uint8"
              },
              {
                "internalType": "uint256",
                "name": "cliffEnd",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "vestingDuration",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "starttime",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "cliffAmount",
                "type": "uint256"
              },
              {
                "internalType": "bytes32",
                "name": "ref",
                "type": "bytes32"
              }
            ],
            "internalType": "struct TokenVestor.Flow[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "adr",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "start",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "length",
            "type": "uint256"
          }
        ],
        "name": "getFlowRecipientPaginated",
        "outputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "int96",
                "name": "flowRate",
                "type": "int96"
              },
              {
                "internalType": "bool",
                "name": "permanent",
                "type": "bool"
              },
              {
                "internalType": "enum TokenVestor.FlowState",
                "name": "state",
                "type": "uint8"
              },
              {
                "internalType": "uint256",
                "name": "cliffEnd",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "vestingDuration",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "starttime",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "cliffAmount",
                "type": "uint256"
              },
              {
                "internalType": "bytes32",
                "name": "ref",
                "type": "bytes32"
              }
            ],
            "internalType": "struct TokenVestor.Flow[]",
            "name": "flows",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getNetFlow",
        "outputs": [
          {
            "internalType": "int96",
            "name": "",
            "type": "int96"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          }
        ],
        "name": "getRoleAdmin",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "index",
            "type": "uint256"
          }
        ],
        "name": "getRoleMember",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          }
        ],
        "name": "getRoleMemberCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "hasRole",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_acceptedToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "host",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "cfa",
            "type": "address"
          }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "addr",
            "type": "address"
          }
        ],
        "name": "launchReady",
        "outputs": [
          {
            "internalType": "bool",
            "name": "canExec",
            "type": "bool"
          },
          {
            "internalType": "bytes",
            "name": "execPayload",
            "type": "bytes"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address[]",
            "name": "targetAddresses",
            "type": "address[]"
          }
        ],
        "name": "launchVesting",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "addr",
            "type": "address"
          }
        ],
        "name": "launchVestingForAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "launchVestingToSender",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nextCloseAddress",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nextCloseDate",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "oldRecipient",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "newRecipient",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "ref",
            "type": "bytes32"
          }
        ],
        "name": "redirectStreams",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address[]",
            "name": "adr",
            "type": "address[]"
          },
          {
            "internalType": "int96[]",
            "name": "flowRate",
            "type": "int96[]"
          },
          {
            "internalType": "uint256[]",
            "name": "cliffEnd",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "vestingDuration",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "cliffAmount",
            "type": "uint256[]"
          },
          {
            "internalType": "bytes32[]",
            "name": "ref",
            "type": "bytes32[]"
          }
        ],
        "name": "registerBatch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address[]",
            "name": "adr",
            "type": "address[]"
          },
          {
            "internalType": "int96[]",
            "name": "flowRate",
            "type": "int96[]"
          },
          {
            "internalType": "uint256[]",
            "name": "cliffEnd",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "vestingDuration",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "cliffAmount",
            "type": "uint256[]"
          },
          {
            "internalType": "bytes32[]",
            "name": "ref",
            "type": "bytes32[]"
          }
        ],
        "name": "registerBatchPermanent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "adr",
            "type": "address"
          },
          {
            "internalType": "int96",
            "name": "flowRate",
            "type": "int96"
          },
          {
            "internalType": "bool",
            "name": "isPermanent",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "cliffEnd",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "vestingDuration",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "cliffAmount",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "ref",
            "type": "bytes32"
          }
        ],
        "name": "registerFlow",
        "outputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "int96",
                "name": "flowRate",
                "type": "int96"
              },
              {
                "internalType": "bool",
                "name": "permanent",
                "type": "bool"
              },
              {
                "internalType": "enum TokenVestor.FlowState",
                "name": "state",
                "type": "uint8"
              },
              {
                "internalType": "uint256",
                "name": "cliffEnd",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "vestingDuration",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "starttime",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "cliffAmount",
                "type": "uint256"
              },
              {
                "internalType": "bytes32",
                "name": "ref",
                "type": "bytes32"
              }
            ],
            "internalType": "struct TokenVestor.Flow",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "renounceRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "role",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "revokeRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_addr",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "_closeDate",
            "type": "uint256"
          }
        ],
        "name": "setNextClose",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes4",
            "name": "interfaceId",
            "type": "bytes4"
          }
        ],
        "name": "supportsInterface",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "contract IERC20",
            "name": "token",
            "type": "address"
          }
        ],
        "name": "upgrade",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "contract IERC20",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    const nonce = await web3.eth.getTransactionCount(DEPLOYER_ADDR);

    const vFactory = new ethers.Contract(addr.vestorFactory, vestorFactoryABI, signer);
    log("b4 create vestor");
    var txn = await (await vFactory.createVestor(addr.idleWETHx, addr.SuperHost, addr.cfa)).wait();
    log("after create vestor", txn);
    const clones = await vFactory.getAllVestors();
    log("Vestor deployed to: " + clones[clones.length -1]);
    addr.vestor = clones[clones.length -1];
    log(addr.vestor);

    vestor = new ethers.Contract(addr.vestor, vestorABI, signer);

    myDog = await Dog.deploy(addr.vestor, addr.donation, addr.WETH, addr.idleWETH, addr.dogMaster, name, symbol, baseURI);
    await myDog.deployed();
    log("Dog deployed to address:", myDog.address);
    log(ethers.utils.id(myDog.address + 1));

    await (await vestor.grantRole(MANAGER, myDog.address)).wait();
    log("Dog added as vestor MANAGER");

    auctionHouse = await House.deploy();
    await auctionHouse.deployed();
    log("Auction House deployed to address:", auctionHouse.address);
    await (await auctionHouse.initialize(myDog.address, addr.WETH, timeBuffer, minBid, percentageBidIncrement, duration, bidTokenName, bidTokenSymbol)).wait();
    log("Auction house initialized");

    await (await myDog.setMinter(auctionHouse.address)).wait();
    log("Minter set");

    //await (await auctionHouse.unpause()).wait();
    //log("Auction House Unpaused");

    const expectedProxyAddress = ethers.utils.getContractAddress({
      from: DEPLOYER_ADDR,
      nonce: parseInt(nonce) + 8,
    });
    log("expected Proxy addr", expectedProxyAddress);

    myExec = await Exec.deploy(expectedProxyAddress, timelockDelay);
    await myExec.deployed();
    log("Executor deployed to address:", myExec.address);
    
    myLogic = await Logic.deploy();
    await myLogic.deployed();
    log("Logic deployed to address:", myLogic.address);

    myProxy = await Proxy.deploy(myExec.address, myDog.address, DEPLOYER_ADDR, DEPLOYER_ADDR, myLogic.address, votePeriod, voteDelay, proposalThresholdPct, quorumPct, { gasLimit: 5000000 });
    await myProxy.deployed();
    log("Proxy deployed to address:", myProxy.address);

    await (await vestor.grantRole(MANAGER, myExec.address)).wait();
    log("Treasury/timelock added as vestor MANAGER");
    await (await vestor.grantRole(LAUNCHER, addr.dogBot)).wait();
    log("dogBot added as vestor LAUNCHER");

    for (let i = 0; i < signers.length; i++) {
      ah[i] = new ethers.Contract(auctionHouse.address, houseJSON.abi, signers[i]);
    }

    sToken = new ethers.Contract(addr.idleWETHx, sTokenABI, signer);
    iToken = new ethers.Contract(addr.idleWETH, iTokenABI, signer);

    sBalStart = await sToken.balanceOf(PUBLIC_KEY);
    log("superToken starting balance of sender is", sBalStart);
});

describe("Auction House", function () {

    it("Should have set owner address", async function () {
        var owner = await auctionHouse.owner();
        expect(owner.toString()).to.equal(DEPLOYER_ADDR);
    });

    it("Should have set Dog contract address", async function () {
        var dogs = await auctionHouse.dogs();
        expect(dogs.toString()).to.equal(myDog.address);
    });

    it("should unpause AuctionHouse", async function(){
      await expect(auctionHouse.unpause())
            .to.emit(auctionHouse, 'Unpaused')
    });

    it("Should not be paused", async function () {
      expect(await auctionHouse.paused()).to.equal(false);
    });
  
    it("Should have started the first auction for Dog #1", async function () {
        var auction = await auctionHouse.auction();
        //log(JSON.stringify(auction));
        expect(parseInt(auction.dogId)).to.equal(1);
    });

    it("Should have started the first auction with 3 day duration (Ukraine Dog)", async function () {
        var auction = await auctionHouse.auction();
        var duration = parseInt(auction.endTime) - parseInt(auction.startTime);
        expect(duration).to.equal(60*60*24*3);
    });

    it.skip("Should set timeBuffer and emit AuctionTimeBufferUpdated", async function () {
        await expect(auctionHouse.setTimeBuffer(60*10))
            .to.emit(auctionHouse, 'AuctionTimeBufferUpdated')
            .withArgs(60*10);
    });

    it("Should set Duration to 24h and emit AuctionDurationUpdated", async function () {
        await expect(auctionHouse.setDuration(60*60*24))
            .to.emit(auctionHouse, 'AuctionDurationUpdated')
            .withArgs(60*60*24);
        expect(parseInt(await auctionHouse.duration())).to.equal(60*60*24);
    });

    it.skip("Should set Reserve price and emit AuctionReservePriceUpdated", async function () {
        await expect(auctionHouse.setReservePrice("90000000000000000"))
            .to.emit(auctionHouse, 'AuctionReservePriceUpdated')
            .withArgs("90000000000000000");
        expect((await auctionHouse.reservePrice()).toString()).to.equal("90000000000000000");
    });

    it.skip("Should set min bid increment and emit AuctionMinBidIncrementPercentageUpdated", async function () {
        await expect(auctionHouse.setMinBidIncrementPercentage(5))
            .to.emit(auctionHouse, 'AuctionMinBidIncrementPercentageUpdated')
            .withArgs(5);
        expect((await auctionHouse.minBidIncrementPercentage()).toString()).to.equal("5");
    });

});

describe("Dog", function () {

    it("Should have set owner address", async function () {
        var owner = await myDog.owner();
        expect(owner.toString()).to.equal(DEPLOYER_ADDR);
    });

    it("Should have Auction contract as minter", async function () {
        var minter = await myDog.minter();
        expect(minter).to.equal(auctionHouse.address);
    });

    it("Should have set dogMaster", async function () {
        var master = await myDog.dogMaster();
        expect(master).to.equal(addr.dogMaster);
    });

    it("Should have set donation DAO address", async function () {
        var dao = await myDog.donationDAO();
        expect(dao).to.equal(addr.donation);
    });

    it("Should have set metadataBaseURI", async function () {
        var uri = await myDog.metadataBaseURI();
        expect(uri).to.equal(baseURI);
    });

    it.skip("Should set baseURI", async function () {
      const uri = await myDog.metadataBaseURI();
      await expect(myDog.setBaseURI(newBaseURI))
          .to.emit(myDog, 'BaseURIUpdated')
          .withArgs(uri, newBaseURI);
      expect(await myDog.metadataBaseURI()).to.equal(newBaseURI);
    });

    it("Should set treasury address", async function () {
      const treasury = await myDog.treasury();
      await expect(myDog.setTreasury(myExec.address))
          .to.emit(myDog, 'TreasuryUpdated')
          .withArgs(treasury, myExec.address);
      expect(await myDog.treasury()).to.equal(myExec.address);
    });

    it.skip("Should set dogMaster address", async function () {
      const master = await myDog.dogMaster();
      await expect(myDog.setDogMaster(addr.dogMaster))
          .to.emit(myDog, 'DogMasterUpdated')
          .withArgs(addr.dogMaster);
      expect(await myDog.dogMaster()).to.equal(addr.dogMaster);
    });

    it("Should set contractURI", async function () {
      const uri = await myDog.contractURI();
      await (await myDog.setContractURIHash(newContractHash)).wait();
      expect(await myDog.contractURI()).to.equal("ipfs://" + newContractHash);
    });

    it.skip("Should set freeze metadata for tokenId 0", async function () {
      await expect(myDog.freezeTokenURI("ipfs://"+newMetaHash, 0))
          .to.emit(myDog, 'PermanentURI')
          .withArgs("ipfs://"+newMetaHash, 0);
      expect(await myDog.tokenURI(0)).to.equal("ipfs://"+newMetaHash);
      await expect(myDog.freezeTokenURI("ipfs://"+newMetaHash, 0))
        .to.be.revertedWith('fzn');
    });

    it("Should set reserveDuration", async function () {
      const dur = await myDog.reserveDuration();
      await expect(myDog.setreserveDuration(newReserveDuration))
          .to.emit(myDog, 'ReserveDurationUpdated')
          .withArgs(dur, newReserveDuration);
      expect(parseInt(await myDog.reserveDuration())).to.equal(newReserveDuration);
      await expect(myDog.setreserveDuration(0))
        .to.be.revertedWith('!0');
    });

    it.skip("Should set donation percentage", async function () {
      const don = await myDog.donationPercentage();
      await expect(myDog.setDonationPercentage(newDonationPercentage))
          .to.emit(myDog, 'DonationPercentageUpdated')
          .withArgs(don, newDonationPercentage);
      expect(parseInt(await myDog.donationPercentage())).to.equal(newDonationPercentage);
      await expect(myDog.setDonationPercentage(99))
        .to.be.revertedWith('!>100');
    });

    it("Should set flowDelay", async function () {
      var delay = await myDog.flowDelay();
      var newDelay = 10;
      await myDog.setFlowDelay(newDelay);
      delay = await myDog.flowDelay();
      expect(parseInt(delay)).to.equal(newDelay);
      // set back to default
      //await (await myDog.setFlowDelay(0)).wait();
      //expect(parseInt(await myDog.flowDelay())).to.equal(0);
    });

});

describe("Streamonomics", function () {

  it("Should return current streamonomics", async function () {
      var stream = await myDog.getStreamonomics();
      expect(stream.length).to.equal(3);
      expect(parseInt(stream[0].percentage)).to.equal(10);
      expect(parseInt(stream[1].percentage)).to.equal(30);
      expect(parseInt(stream[2].percentage)).to.equal(10);
      expect(parseInt(stream[0].limit)).to.equal(1);
      expect(parseInt(stream[1].limit)).to.equal(20);
      expect(parseInt(stream[2].limit)).to.equal(1);
  });

  it.skip("Should reset Streamonomics", async function () {
    var pct = [10, 10, 10, 10];
    var start = [1, 1, 10, 100];
    var step = [1, 5, 1, 25];
    var limit = [1, 20, 1, 4];
    await expect(myDog.setStreamonomics(pct, start, step, limit))
        .to.emit(myDog, 'StreamonomicAdded')
        .withArgs(pct[3], start[3], step[3], limit[3]);
    var stream = await myDog.getStreamonomics();
    expect(stream[3].start).to.equal(100);
    expect(stream[1].limit).to.equal(20);
  });

});

});

describe("Bidding and Settling", function () {
  
  before('Only on local fork', async function () {
    if ( network.chainId != 1337) {
      this.skip();
    } else {
      if ( ah.length == 0 ) {
        for (let i = 0; i < signers.length; i++) {
          ah[i] = new ethers.Contract("0xE590907FB839A683D6b6Da36Bcf566757e617B06", houseJSON.abi, signers[i]);
        }
        auctionHouse = ah[0];
      }
      for (let i = 0; i < signers.length; i++) {
        weth = new ethers.Contract(addr.WETH, ERC20abi, signers[i]);
        await (await weth.approve(auctionHouse.address, '1000000000000000000000000000000')).wait();
      }
      weth = new ethers.Contract(addr.WETH, ERC20abi, signers[0]);
      for (let j = 1; j < signers.length; j++) {
        //await (await weth.transfer(biddersPub[j], '200000000000000000000')).wait();
      }
    }
  });

  beforeEach("check vestorBal", async function(){
    var vBal = await sToken.balanceOf(addr.vestor);
    log("vestor reserves", vBal);
  });
  
  for (let i = 2; i < 42; i++) {

    it("Bid and settle auction for Dog#" + Math.random(), async function () {
      this.timeout(240000);
      var auction = await auctionHouse.auction();
      var bidder = auction.bidder;
      var index = Math.floor(Math.random() * 5);
      auctionHouse = ah[index];
      bidder = biddersPub[index];
      var tokenId = parseInt(auction.dogId);
      if (tokenId == 1) {
        // force winner of Dog#1
        auctionHouse = ah[0];
        bidder = PUBLIC_KEY;
      }
      var duration = parseInt(auction.endTime) - parseInt(auction.startTime);
      log("Current auction for Dog#" + tokenId + " with duration of " + duration/60/60 + " hours");
      // bid:
      var amt = '1000000000000000000'; // 1 WETH
      if (tokenId != 6) {
        await expect(auctionHouse.createBid(tokenId, amt))
          .to.emit(auctionHouse, 'AuctionBid')
          .withArgs(tokenId, bidder, amt, false);
        // speed up time:
      } else {
        amt = '0';
        bidder = "0x0000000000000000000000000000000000000000";
      }
      chainTime = parseInt(auction.endTime) + 1;
      await hre.network.provider.request({
        method: "evm_setNextBlockTimestamp",
        params: [chainTime],
      });
      //log("time sped up");
      var unchainBalBefore = await weth.balanceOf(addr.unchain);
      var tx = await auctionHouse.settleCurrentAndCreateNewAuction();
      await expect(tx)
        .to.emit(auctionHouse, 'AuctionSettled')
        .withArgs(tokenId, bidder, amt);
      //log("settled");
      if (amt != '0') {
        var unchainBalAfter = await weth.balanceOf(addr.unchain);
        console.log("unchain donation, amt", unchainBalAfter - unchainBalBefore, amt);
        expect(unchainBalAfter).to.be.gt(unchainBalBefore);
      }
      if (tokenId > 120) {
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed;
        log(`Gas Used to settle auction for Dog#${tokenId}: ${commaify(gasUsed)}`);
      }
      if (tokenId % 20 == 0) {
        log("sleeping...");
        await sleep(5000);
        log("waking...");
      }
    });

  }

  afterEach("claim streams", async function(){
    for (let i = 0; i < signers.length; i++) {
      var ready = await vestor.launchReady(biddersPub[i]);
      //log("ready", ready);
      if (ready[0]) {
        log("ready to launch for", biddersPub[i]);
        await (await vestor.launchVestingForAddress(biddersPub[i])).wait();
      }
    }
  });

  after("get timestamp", async function(){
      var auction = await auctionHouse.auction();
      lastAuctionStart = auction.startTime;
  });

});

describe.skip("TokenVesting", function () {
  
  before('Only on local fork', async function () {
    network = await ethers.provider.getNetwork();
    if ( network.chainId != 1337) {
      this.skip();
    } else {
      sBalStart = await sToken.balanceOf(PUBLIC_KEY);
      log("superToken starting balance of sender is", sBalStart);
    }
  });

  it.skip('Should return true for launchReady', async function () {
    this.timeout(240000);
    var ready = await vestor.launchReady(PUBLIC_KEY);
    expect(ready[0]).to.equal(true);
  });

  it.skip('Should launching vesting for the sender', async function () {
    this.timeout(240000);
    await expect(vestor.launchVestingToSender())
        .to.emit(vestor, 'FlowStarted');
    // speed up time, get some flow
    chainTime += 60*60*3;
    await hre.network.provider.request({
      method: "evm_increaseTime",
      params: [60*60*3],
    });
  });

  it.skip('Should launching vesting for the others', async function () {
    this.timeout(240000);
    for (let i = 1; i < signers.length; i++) {
      log("ready to launch for", biddersPub[i]);
      await expect(vestor.launchVestingForAddress(biddersPub[i]))
          .to.emit(vestor, 'FlowStarted');
    }
    chainTime += 60*60*24*3;
    await hre.network.provider.request({
      method: "evm_increaseTime",
      params: [60*60*24*3],
    });
  });

});

describe("SuperFluid", function () {
  
  before('Only on local fork', async function () {
    network = await ethers.provider.getNetwork();
    if ( network.chainId != 1337) {
      this.skip();
    } else {
      //
    } 
  });

  it('Should have sToken Balance', async function () {
    this.timeout(240000);
    var sBal = await sToken.balanceOf(PUBLIC_KEY);
    expect(sBal).to.be.gt(0);
  });

  it('Should downgrade from Super', async function () {
    this.timeout(240000);
    var iBalBefore = await iToken.balanceOf(PUBLIC_KEY);
    log('iToken balance of sender is', iBalBefore);
    var iBalContract = await iToken.balanceOf(addr.idleWETHx);
    log('iToken balance of Super Token contract is', iBalContract);
    var sBal = await sToken.balanceOf(PUBLIC_KEY);
    log("superToken balance of sender is", sBal);
    var sRealtimeBal = await sToken.realtimeBalanceOfNow(PUBLIC_KEY);
    log("superToken realtime balance of sender is", sRealtimeBal);
    var sSupply = await sToken.totalSupply();
    log("superToken totalSupply is", sSupply);
    var underlying = await sToken.getUnderlyingToken();
    log("superToken underlying is", underlying);
    expect(underlying).to.equal(addr.idleWETH);
    var underlyingDecimals = await iToken.decimals();
    var sTokenDecimals = await sToken.decimals();
    log("superToken underlying decimals is", underlyingDecimals);
    expect(underlyingDecimals).to.equal(sTokenDecimals);
    //sBal = '1000';   // TODO: fix this
    var amt = parseInt(sBal) - parseInt(sBalStart);
    log("amt", amt);
    await (await sToken.connect(signers[0]).downgrade(amt.toString())).wait();
    var iBalAfter = await iToken.balanceOf(PUBLIC_KEY);
    log("iBalAfter", iBalAfter);
    expect(iBalAfter - iBalBefore).to.be.closeTo(amt, 1000);
    expect(iBalAfter).to.be.gt(iBalBefore);
  });

});

describe("Idle Finance", function () {
  
  before('Only on local fork', async function () {
    network = await ethers.provider.getNetwork();
    if ( network.chainId != 1337) {
      this.skip();
    } 
  });

  it('Should have iToken Balance', async function () {
    this.timeout(240000);
    var iBal = await iToken.balanceOf(PUBLIC_KEY);
    expect(iBal).to.be.gt(0);
  });

  it('Should withdraw iTokens to underlying', async function () {
    this.timeout(240000);
    var wethBefore = await weth.balanceOf(PUBLIC_KEY);
    log("wethBefore", wethBefore);
    var iBal = await iToken.balanceOf(PUBLIC_KEY);
    expect(iBal).to.be.gt(0);
    var price = await iToken.tokenPrice();
    log("price", price);
    var expectedAmt = iBal * price / 1e18;
    log("expected", expectedAmt);
    await (await iToken.connect(signers[0]).redeemIdleToken(iBal)).wait();
    var wethAfter = await weth.balanceOf(PUBLIC_KEY);
    log("wethAfter", wethAfter);
    expect(wethAfter).to.be.gt(wethBefore);
    expect(wethAfter - wethBefore).to.be.closeTo(expectedAmt, 100000000000000);
  });

});

describe("Dog Flows and Transfers", function () {
  
  before('Only on local fork', async function () {
    network = await ethers.provider.getNetwork();
    if ( network.chainId != 1337) {
      this.skip();
    } 
  });

  it('Should output flowRate for Dog#1', async function () {
    this.timeout(240000);
    var tokenId = 1;
    var owner = await myDog.ownerOf(tokenId);
    var flowCount = await vestor.getFlowCount(owner);
    log("flowCount", flowCount);
    var ref = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode([ "address", "uint256" ], [ myDog.address, tokenId ]));
    var flows = await vestor.getFlowRecipient(owner);
    log("flows.length", flows.length);
    var flowRate = 0;
    var fcount = 0;
    for (let i = 0; i < flows.length; i++) {
      //log(flows[i]);
      //log("ref", ref);
      //log("flows[i].ref", flows[i].ref);
      //log("flows[i].state", flows[i].state);
      if ( flows[i].ref == ref ) {
        if ( flows[i].state == 1 ) {
          fcount++;
          flowRate += parseInt(flows[i].flowRate);
        } else {
          log("flow.state is not 1");
        }
      }
    }
    log("number of active flows for Dog#" + tokenId + " is ", fcount);
    log("flowRate for Dog#" + tokenId + " is ", flowRate);
    expect(flowRate).to.be.gt(0);
  });

  it.skip('Should issue Dog#6 from Dog Contract', async function () {
    const tokenId = 6;
    expect(await myDog.ownerOf(tokenId))
      .to.equal(myDog.address); 
    const amt = 0;
    await expect(myDog.issue(PUBLIC_KEY, tokenId, amt))
      .to.emit(myDog, 'NFTIssued')
      .withArgs(tokenId, PUBLIC_KEY);
    expect(await myDog.ownerOf(tokenId))
    .to.equal(PUBLIC_KEY); 
  });

  it('Should have already sent Dog#6 to treasury', async function () {
    const tokenId = 6;
    expect(await myDog.ownerOf(tokenId))
      .to.equal(myExec.address); 
  });

  it('Should have already sent Dog#11 to dogMasters', async function () {
    const tokenId = 11;
    expect(await myDog.ownerOf(tokenId))
      .to.equal(addr.dogMaster); 
  });

  it("Should transfer Dog#1 to new address", async function(){
    const tokenId = 1;
    const owner = await myDog.ownerOf(tokenId);
    expect(owner).to.equal(PUBLIC_KEY);

    var vBal = await sToken.balanceOf(addr.vestor);
    log("vestor reserves", vBal);

    var thisDog = new ethers.Contract(myDog.address, dogJSON.abi, signers[0]);

    const newOwner = "0xC0867C71B92F41AfA48f62Bc9BB21b8CF4262F78"; // Kramer
    await expect(thisDog["safeTransferFrom(address,address,uint256)"](PUBLIC_KEY, newOwner, tokenId))
      .to.emit(thisDog, 'Transfer')
      .withArgs(PUBLIC_KEY, newOwner, tokenId);
    expect(await thisDog.ownerOf(tokenId))
      .to.equal(newOwner); 
  });

  it("Should have redirected flows to newOwner", async function(){
    const newOwner = "0xC0867C71B92F41AfA48f62Bc9BB21b8CF4262F78"; // Kramer
    var flows = await vestor.getFlowRecipient(newOwner);
    log("newOwner flows", flows);
    expect(flows.length).to.be.gt(0);
  });

});

describe("Treasury / Timelock", function () {

  it('Should have iToken balance in treasury', async function () {
    var bal = await iToken.balanceOf(myExec.address);
    log("treasury iToken balance", bal);
    expect(bal).to.be.gt(0);
  });

  it.skip('Should queue transaction', async function () {
    var target = PUBLIC_KEY;
    var value = 0;
    var signature = 'getBalanceOf(address)';
    var callData = encodeParameters(['address'], [PUBLIC_KEY]);
    var eta = parseInt(lastAuctionStart) + 60*60*3*2 + 10;
    await expect(myExec.queueTransaction(target, value, signature, callData, eta))
          .to.emit(myExec, 'QueueTransaction');
  });

  it.skip('Should execute transaction', async function () {
    var target = PUBLIC_KEY;
    var value = 0;
    var signature = 'getBalanceOf(address)';
    var callData = encodeParameters(['address'], [PUBLIC_KEY]);
    var eta = chainTime + 10;
    await expect(myExec.executeTransaction(target, value, signature, callData, eta))
      .to.be.reverted;
    chainTime = eta + 1;
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [chainTime],
    });
    await expect(myExec.executeTransaction(target, value, signature, callData, eta))
      .to.emit(myExec, 'ExecuteTransaction');
  });

  it.skip('Should queue transfer transaction', async function () {
    var target = addr.idleWETH;
    var value = 0;
    var signature = 'transfer(address,uint256)';
    var callData = encodeParameters(['address','uint256'], [PUBLIC_KEY, 1000]);
    var eta = parseInt(lastAuctionStart) + 60*60*3*2 + 10 + 10;
    await expect(myExec.queueTransaction(target, value, signature, callData, eta))
          .to.emit(myExec, 'QueueTransaction');
  });

  it.skip('Should execute transfer transaction', async function () {
    var target = addr.idleWETH;
    var value = 0;
    var signature = 'transfer(address,uint256)';
    var callData = encodeParameters(['address','uint256'], [PUBLIC_KEY, 1000]);
    var eta = chainTime + 10;
    chainTime = eta + 1;
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [chainTime],
    });
    var beforeBal = await iToken.balanceOf(PUBLIC_KEY);
    await expect(myExec.executeTransaction(target, value, signature, callData, eta))
          .to.emit(myExec, 'ExecuteTransaction');
    var afterBal = await iToken.balanceOf(PUBLIC_KEY);
    expect(afterBal - beforeBal).to.equal(1000);
  });

});

describe("Governance", function () {

  before("load gov proxy with implementation abi", async function(){
    network = await ethers.provider.getNetwork();
    if (myProxy) {
      gov = new ethers.Contract(myProxy.address, govJSON.abi, signers[0]);
    } else {
      gov = new ethers.Contract("0x0CF107a8a32d7FeD552A5AE14da6344071A31896", govJSON.abi, signer);
    }
  });

  it("Should set voteDelay", async function () {
    voteDelay = 100;
    await expect(gov.connect(signer)._setVotingDelay(voteDelay))
        .to.emit(gov, 'VotingDelaySet');
  });

  it.skip("Should set votePeriod", async function () {
    votePeriod = 43200;
    await expect(gov._setVotingPeriod(votePeriod))
        .to.emit(gov, 'VotingPeriodSet');
  });

  it("should delegate voting power", async function(){
    const dogTwo = new ethers.Contract(myDog.address, dogJSON.abi, signers[1]);
    var votesBefore = await dogTwo.getCurrentVotes(biddersPub[1]);   
    await expect(dogTwo.delegate(PUBLIC_KEY))
            .to.emit(dogTwo, 'DelegateChanged');
    var votesAfter = await dogTwo.getCurrentVotes(biddersPub[1]);  
    expect(votesAfter).to.be.lt(votesBefore);
  });

  it.skip('Should set Governance as **pending** Timelock admin', async function () {
      // Queue it:
      var target = myExec.address;
      var value = 0;
      var signature = 'setPendingAdmin(address)';
      var callData = encodeParameters(['address'], [myProxy.address]);
      var eta = chainTime + 10;
      await expect(myExec.queueTransaction(target, value, signature, callData, eta))
            .to.emit(myExec, 'QueueTransaction');
      chainTime = eta + 1
      // wait:
      await hre.network.provider.request({
        method: "evm_setNextBlockTimestamp",
        params: [chainTime],
      });

      // execute:
      await expect(myExec.executeTransaction(target, value, signature, callData, eta))
            .to.emit(myExec, 'ExecuteTransaction');

      // check:
      var pending = await myExec.pendingAdmin();
      expect(pending).to.equal(myProxy.address);
  });

  it('Should propose to approve/deposit iTokens to Vestor', async function () {
    var targets = [addr.idleWETH, addr.vestor];
    var values = [0,0];
    var signatures = ['approve(address,uint256)', 'deposit(address,uint256)'];
    var callData1 = encodeParameters(['address','uint256'], [addr.vestor, '20000000000000000000']); // 20 idleWETH
    var callData2 = encodeParameters(['address','uint256'], [addr.idleWETH, '20000000000000000000']); // 20 idleWETH
    var callDatas = [callData1, callData2];
    var description = "TEST: transfer iTokens to Vestor";
    const pCount = await gov.proposalCount();
    await expect(gov.propose(targets, values, signatures, callDatas, description))
            .to.emit(gov, 'ProposalCreated');
    const id = await gov.proposalCount();
    log("proposal id", id);
    expect(id - pCount).to.equal(1);
  });

  it('Should submit vote FOR proposal', async function () {
    this.timeout(2400000);
    const id = await gov.proposalCount();
    const state = await gov.state(id);
    log("state", state);
    const proposal = await gov.proposals(id);
    log("proposal", proposal);
    log("start block", parseInt(proposal.startBlock));
    const support = 1; // 0=against, 1=for, 2=abstain
    //advance blocks
    var blocks = voteDelay + 100;
    if ( network.chainId == 1337) {
      //for (let i = 0; i < blocks; i++) {
        //await hre.network.provider.send('evm_mine');
        //var currentBlock = await hre.network.provider.send('eth_blockNumber');
        //log("current block", parseInt(currentBlock));
        //if ( parseInt(currentBlock) > parseInt(proposal.startBlock) ) {
        //  break;
        //}
      //}
      await hre.network.provider.send("hardhat_mine", [ethers.utils.hexStripZeros(ethers.utils.hexlify(blocks)), ethers.utils.hexStripZeros(ethers.utils.hexlify(2))]);
    }
    await expect(gov.castVote(id, support))
            .to.emit(gov, 'VoteCast');
    const receipt = await gov.getReceipt(id, PUBLIC_KEY);
    log("vote receipt", receipt);
  });

  it('Should QUEUE proposal', async function () {
    this.timeout(2400000);
    const id = await gov.proposalCount();
    const state = await gov.state(id);
    log("state", state);
    const proposal = await gov.proposals(id);
    log("proposal", proposal);
    log("endblock", parseInt(proposal.endBlock));
    //advance blocks
    var blocks = votePeriod + 100;
    //for (let i = 0; i < blocks; i++) {
      //await hre.network.provider.send('evm_mine');
      //var currentBlock = await hre.network.provider.send('eth_blockNumber');
      //log("current block", parseInt(currentBlock));
      //if ( parseInt(currentBlock) > parseInt(proposal.endBlock) ) {
      //  break;
      //}
    //}
    await hre.network.provider.send("hardhat_mine", [ethers.utils.hexStripZeros(ethers.utils.hexlify(blocks)), ethers.utils.hexStripZeros(ethers.utils.hexlify(2))]);
    await expect(gov.connect(signer).queue(id))
            .to.emit(gov, 'ProposalQueued');
  });

  it('Should NOT veto proposal from non-Vetoer address', async function () {
    this.timeout(240000);
    const id = await gov.proposalCount();
    const state = await gov.state(id);
    log("state", state);
    const proposal = await gov.proposals(id);
    log("proposal", proposal);
    const eta = proposal.eta;
    chainTime = parseInt(eta) + 1;
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [chainTime],
    });
    const govTwo = new ethers.Contract(myProxy.address, govJSON.abi, signers[1]);
    await expect(govTwo.veto(id))
            .to.be.reverted;
  });

  it('Should EXECUTE proposal', async function () {
    this.timeout(240000);
    const id = await gov.proposalCount();
    const state = await gov.state(id);
    log("state", state);
    const proposal = await gov.proposals(id);
    log("proposal", proposal);
    const eta = proposal.eta;
    chainTime = parseInt(eta) + 1;
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [chainTime],
    });
    var iBal = await iToken.balanceOf(myExec.address);
    log("treasury iToken bal", iBal);
    var beforeBal = await sToken.balanceOf(addr.vestor);
    await expect(gov.execute(id))
            .to.emit(gov, 'ProposalExecuted');
    var afterBal = await sToken.balanceOf(addr.vestor);
    expect(afterBal).to.be.gt(beforeBal);
  });

  it('Should submit proposal and VETO proposal', async function () {
    var targets = [addr.idleWETH];
    var values = [0];
    var signatures = ['transfer(address,uint256)'];
    var callData = encodeParameters(['address','uint256'], [PUBLIC_KEY, 200]);
    var callDatas = [callData];
    var description = "TEST: transfer iTokens";
    const pCount = await gov.proposalCount();
    await expect(gov.propose(targets, values, signatures, callDatas, description))
            .to.emit(gov, 'ProposalCreated');
    const id = await gov.proposalCount();
    log("proposal id", id);
    expect(id - pCount).to.equal(1);
    await expect(gov.connect(signer).veto(id))
            .to.emit(gov, 'ProposalVetoed');
    const state = await gov.state(id);
    log("state", state);
  });

});

describe("TokenVesting: Close Streams", async function(){

  it("should output first close date", async function(){
    const nextDate = await vestor.nextCloseDate();
    log("nextDate", nextDate);
    expect(nextDate).to.be.gt(0);
  });

  it("should close streams", async function(){
    const nextDate = await vestor.nextCloseDate();
    if ( chainTime < nextDate ) {
      // go to the future
      chainTime = parseInt(nextDate) + 60*60*24*30; // temp, fix this
      await hre.network.provider.request({
        method: "evm_setNextBlockTimestamp",
        params: [chainTime],
      });
    }
    var nextAddress = await vestor.nextCloseAddress();
    log("nextAddess", nextAddress);
    var toClose = [nextAddress];
    await expect(vestor.closeVesting(toClose))
      .to.emit(vestor, "FlowStopped");
  });

});