const { expect } = require("chai");
const { ethers } = require("hardhat");

require('dotenv').config();
var BN = web3.utils.BN;
const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
var biddersPriv = [
  PRIVATE_KEY,
  ,
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

const houseJSON = require("../artifacts/contracts/DogsAuctionHouse.sol/DogsAuctionHouse.json");

const newContractHash = "bafkreidgmzjyncpofwxiqnaod7pfdwuhmoakuwsenr54dx4xp32ewy5y6y";
const newMetaHash = "bafkreifq7jr7qprkodhdkhcuodo3ht4rn7oy362abpd4ercmqf5synhwtq";
const newBaseURI = "https://degendogs.club/metadata/new/";
const newReserveDuration = 60*60*24*21;
const newDonationPercentage = 5;

var lastId = 0;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

function commaify(nStr) { nStr += ''; x = nStr.split('.'); x1 = x[0]; x2 = x.length > 1 ? '.' + x[1] : ''; var rgx = /(\d+)(\d{3})/; while (rgx.test(x1)) { x1 = x1.replace(rgx, '$1' + ',' + '$2'); } return x1 + x2; }

const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider);
const signers = [
  signer,
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

var addr = {};
var chain = "polygon";
if (chain == "polygon") {
  addr.vestorFactory = "0xE26964141B3bE79fbEE0459f8A06903686DF47AD"; //localhost
  addr.vestor = "0xdbdF8EA5C514bd1ca8A294a1e6C361502592E457"; // localhost:polygon
  addr.donation = "0x7319cC808A557d07626D167631c524516b42E8fe"; // localhost:polygon
  addr.WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // polygon
  addr.idleWETH = "0xfdA25D931258Df948ffecb66b5518299Df6527C4"; // polygon
  addr.idleWETHx = "0xEB5748f9798B11aF79F892F344F585E3a88aA784"; // polygon
  addr.dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // TODO: change this
  addr.SuperHost = "0x3E14dC1b13c488a8d5D310918780c983bD5982E7";
  addr.cfa = "0x6EeE6060f715257b970700bc2656De21dEdF074C";
}
if (chain == "mumbai") {
  //Mumbai:
  addr.vestor = "0xd718d66D0917f80Af45dC13d58001541FB865FCe"; // mumbai for mock idleWETH
  addr.donation = "0x38a9E2F074a1dd08249F7D2fb8B31b8661D1920B"; // mumbai
  addr.WETH = "0x3C68CE8504087f89c640D02d133646d98e64ddd9"; 
  addr.idleWETH = "0x490B8896ff200D32a100A05B7c0507E492938BBb"; // MOCK
  addr.idleWETHx = "0x0CCe2C9980711ddc5AA725AF68A10960E49Fd2Ed"; // wrap of MOCK
  addr.dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // TODO: change this
  addr.SuperHost = "0xEB796bdb90fFA0f28255275e16936D25d3418603";
  addr.cfa = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873";
}

const name = "Degen Dogs";
const symbol = "DOG";
const baseURI = "https://api.degendogs.club/meta/";
const idleWETH = "0xfdA25D931258Df948ffecb66b5518299Df6527C4"; // polygon
const bidTokenName = "Dog Biscuits";
const bidTokenSymbol = "BSCT";
const dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // TODO: change this

var myDog, auctionHouse, myExec, myLogic, myProxy, vestor;
var ah = [];

describe("Setup and Contract Config", function () {

before('Deploy Contracts', async function () {
    // runs once before the first test in this block
    this.timeout(60000);
    network = await ethers.provider.getNetwork();
    console.log(network.chainId);
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

    const vFactory = new ethers.Contract(addr.vestorFactory, vestorFactoryABI, signer);
    await (await vFactory.createVestor(addr.idleWETHx, addr.SuperHost, addr.cfa)).wait();
    const clones = await vFactory.getAllVestors();
    console.log("Vestor deployed to: " + clones[clones.length -1]);
    addr.vestor = clones[clones.length -1];
    console.log(addr.vestor);

    vestor = new ethers.Contract(addr.vestor, vestorABI, signer);

    myDog = await Dog.deploy(addr.vestor, addr.donation, addr.WETH, addr.idleWETH, addr.dogMaster, name, symbol, baseURI);
    await myDog.deployed();
    console.log("Dog deployed to address:", myDog.address);

    await (await vestor.grantRole(MANAGER, myDog.address)).wait();
    console.log("Dog added as vestor MANAGER");

    auctionHouse = await House.deploy();
    await auctionHouse.deployed();
    console.log("Auction House deployed to address:", auctionHouse.address);
    await (await auctionHouse.initialize(myDog.address, addr.WETH, 60*1, "100000000000000000", 10, 60*5, bidTokenName, bidTokenSymbol)).wait();
    console.log("Auction house initialized");

    await (await myDog.setMinter(auctionHouse.address)).wait();
    console.log("Minter set");

    await (await auctionHouse.unpause()).wait();
    console.log("Auction House Unpaused");

    myExec = await Exec.deploy(PUBLIC_KEY, 3);
    await myExec.deployed();
    console.log("Executor deployed to address:", myExec.address);
    
    myLogic = await Logic.deploy();
    await myLogic.deployed();
    console.log("Logic deployed to address:", myLogic.address);

    myProxy = await Proxy.deploy(myExec.address,myDog.address, PUBLIC_KEY, PUBLIC_KEY,myLogic.address,5760,1,1,200,{ gasLimit: 5000000 });
    await myProxy.deployed();
    console.log("Proxy deployed to address:", myProxy.address);

    for (let i = 0; i < signers.length; i++) {
      ah[i] = new ethers.Contract(auctionHouse.address, houseJSON.abi, signers[i]);
    }
});

describe("Auction House", function () {

    it("Should set owner address", async function () {
        var owner = await auctionHouse.owner();
        expect(owner.toString()).to.equal(PUBLIC_KEY);
    });

    it("Should set Dog contract address", async function () {
        var dogs = await auctionHouse.dogs();
        expect(dogs.toString()).to.equal(myDog.address);
    });

    it("Should not be paused", async function () {
      expect(await auctionHouse.paused()).to.equal(false);
    });
  
    it("Should start the first auction for Dog #1", async function () {
        var auction = await auctionHouse.auction();
        //console.log(JSON.stringify(auction));
        expect(parseInt(auction.dogId)).to.equal(1);
    });

    it("Should start the first auction with 2 hour duration", async function () {
        var auction = await auctionHouse.auction();
        var duration = parseInt(auction.endTime) - parseInt(auction.startTime);
        expect(duration).to.equal(60*60*2);
    });

    it("Should set timeBuffer and emit AuctionTimeBufferUpdated", async function () {
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

    it("Should set Reserve price and emit AuctionReservePriceUpdated", async function () {
        await expect(auctionHouse.setReservePrice("90000000000000000"))
            .to.emit(auctionHouse, 'AuctionReservePriceUpdated')
            .withArgs("90000000000000000");
        expect((await auctionHouse.reservePrice()).toString()).to.equal("90000000000000000");
    });

    it("Should set min bid increment and emit AuctionMinBidIncrementPercentageUpdated", async function () {
        await expect(auctionHouse.setMinBidIncrementPercentage(5))
            .to.emit(auctionHouse, 'AuctionMinBidIncrementPercentageUpdated')
            .withArgs(5);
        expect((await auctionHouse.minBidIncrementPercentage()).toString()).to.equal("5");
    });

});

describe("Dog", function () {

    it("Should set owner address", async function () {
        var owner = await myDog.owner();
        expect(owner.toString()).to.equal(PUBLIC_KEY);
    });

    it("Should have Auction contract as minter", async function () {
        var minter = await myDog.minter();
        expect(minter).to.equal(auctionHouse.address);
    });

    it("Should have dogMaster", async function () {
        var master = await myDog.dogMaster();
        expect(master).to.equal(dogMaster);
    });

    it("Should have donation DAO address", async function () {
        var dao = await myDog.donationDAO();
        expect(dao).to.equal(addr.donation);
    });

    it("Should have metadataBaseURI", async function () {
        var uri = await myDog.metadataBaseURI();
        expect(uri).to.equal(baseURI);
    });

    it("Should set baseURI", async function () {
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

    it("Should set dogMaster address", async function () {
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

    it("Should set freeze metadata for tokenId 0", async function () {
      await expect(myDog.freezeTokenURI("ipfs://"+newMetaHash, 0))
          .to.emit(myDog, 'PermanentURI')
          .withArgs("ipfs://"+newMetaHash, 0);
      expect(await myDog.tokenURI(0)).to.equal("ipfs://"+newMetaHash);
      await expect(myDog.freezeTokenURI("ipfs://"+newMetaHash, 0))
        .to.be.revertedWith('frozen');
    });

    it("Should set reserveDuration", async function () {
      const dur = await myDog.reserveDuration();
      await expect(myDog.setreserveDuration(newReserveDuration))
          .to.emit(myDog, 'ReserveDurationUpdated')
          .withArgs(dur, newReserveDuration);
      expect(parseInt(await myDog.reserveDuration())).to.equal(newReserveDuration);
      await expect(myDog.setreserveDuration(0))
        .to.be.revertedWith('!zero');
    });

    it("Should set donation percentage", async function () {
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
    if ( network.chainId != 31337) {
      this.skip();
    } else {
      if ( ah.length == 0 ) {
        for (let i = 0; i < signers.length; i++) {
          ah[i] = new ethers.Contract("0xE590907FB839A683D6b6Da36Bcf566757e617B06", houseJSON.abi, signers[i]);
        }
        auctionHouse = ah[0];
      }
      var weth;
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

  for (let i = 2; i < 400; i++) {

    it("Bid and settle auction for Dog#" + Math.random(), async function () {
      this.timeout(240000);
      var index = Math.floor(Math.random() * 5);
      auctionHouse = ah[index];
      var auction = await auctionHouse.auction();
      var tokenId = parseInt(auction.dogId);
      lastId = tokenId + 1;
      var duration = parseInt(auction.endTime) - parseInt(auction.startTime);
      console.log("Current auction for Dog#" + tokenId + " with duration of " + duration/60/60 + " hours");
      // bid:
      const amt = '1200000000000000000'; // 1 WETH
      await expect(auctionHouse.createBid(tokenId, amt))
        .to.emit(auctionHouse, 'AuctionBid')
        .withArgs(tokenId, biddersPub[index], amt, false);
      // speed up time:
      await hre.network.provider.request({
        method: "evm_setNextBlockTimestamp",
        params: [parseInt(auction.endTime) + 1],
      });
      var tx = await auctionHouse.settleCurrentAndCreateNewAuction();
      await expect(tx)
        .to.emit(auctionHouse, 'AuctionSettled')
        .withArgs(tokenId, biddersPub[index], amt);
      if (tokenId > 50) {
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed;
        console.log(`Gas Used to settle auction for Dog#${tokenId}: ${commaify(gasUsed)}`);
      }
      if (tokenId % 20 == 0) {
        console.log("sleeping...");
        await sleep(5000);
        console.log("waking...");
      }
    });

  }



});

describe("TokenVesting", function () {
  
  before('Only on local fork', async function () {
    network = await ethers.provider.getNetwork();
    if ( network.chainId != 31337) {
      this.skip();
    }
  });

  it('Should launching vestor for the sender', async function () {
    this.timeout(240000);
    await expect(vestor.launchVestingToSender())
        .to.emit(vestor, 'FlowStarted');
  });

});