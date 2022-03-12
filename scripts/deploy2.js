const { ethers } = require("hardhat");

require('dotenv').config();
var BN = web3.utils.BN;
const DEPLOYER_ADDR = process.env.DEPLOYER_ADDR;
const DEPLOYER_PRIV = process.env.DEPLOYER_PRIV;

const MANAGER = web3.utils.keccak256("MANAGER_ROLE");
const LAUNCHER = web3.utils.keccak256("LAUNCHER_ROLE");

const dogJSON = require("../artifacts/contracts/Dog.sol/Dog.json");
const houseJSON = require("../artifacts/contracts/DogsAuctionHouse.sol/DogsAuctionHouse.json");
const govJSON = require("../artifacts/contracts/governance/DegenDAOLogicV1.sol/DegenDAOLogicV1.json");

const signer = new ethers.Wallet(DEPLOYER_PRIV, ethers.provider);

var network;

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

var myDog, auctionHouse, myExec, myLogic, myProxy, vestor;

// Gas
const gasOptions = {"maxPriorityFeePerGas": "45000000000", "maxFeePerGas": "45000000016" };

// Dog Settings
const name = "Degen Dogs";
const symbol = "DOG";
const baseURI = "https://api.degendogs.club/meta/";
const newReserveDuration = 60*60*24*7*8;
const flowDelay = 10;

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

async function main() {
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
    var txn = await (await vFactory.createVestor(addr.idleWETHx, addr.SuperHost, addr.cfa, gasOptions)).wait();
    const clones = await vFactory.getAllVestors();
    log("Vestor deployed to: " + clones[clones.length -1]);
    addr.vestor = clones[clones.length -1];

    vestor = new ethers.Contract(addr.vestor, vestorABI, signer);

    myDog = await Dog.deploy(addr.vestor, addr.donation, addr.WETH, addr.idleWETH, addr.dogMaster, name, symbol, baseURI);
    await myDog.deployed();
    log("Dog deployed to address:", myDog.address);
    log(`npx hardhat verify --network ${chain} ${myDog.address} ${addr.vestor} ${addr.donation} ${addr.WETH} ${addr.idleWETH} ${addr.dogMaster} "${name}" ${symbol} ${baseURI}`);

    await (await vestor.grantRole(MANAGER, myDog.address, gasOptions)).wait();
    log("Dog added as vestor MANAGER");

    auctionHouse = await House.deploy();
    await auctionHouse.deployed();
    log("Auction House deployed to address:", auctionHouse.address);
    log(`npx hardhat verify --network ${chain} ${auctionHouse.address}`);
    await (await auctionHouse.initialize(myDog.address, addr.WETH, timeBuffer, minBid, percentageBidIncrement, duration, bidTokenName, bidTokenSymbol, gasOptions)).wait();
    log("Auction house initialized");

    await (await myDog.setMinter(auctionHouse.address, gasOptions)).wait();
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
    log(`npx hardhat verify --network ${chain} ${myExec.address} ${expectedProxyAddress} ${timelockDelay}`);
    
    myLogic = await Logic.deploy();
    await myLogic.deployed();
    log("Logic deployed to address:", myLogic.address);
    log(`npx hardhat verify --network ${chain} ${myLogic.address}`);

    myProxy = await Proxy.deploy(myExec.address, myDog.address, DEPLOYER_ADDR, DEPLOYER_ADDR, myLogic.address, votePeriod, voteDelay, proposalThresholdPct, quorumPct, { gasLimit: 5000000 });
    await myProxy.deployed();
    log("Proxy deployed to address:", myProxy.address);
    log(`npx hardhat verify --network ${chain} ${myProxy.address} ${myExec.address} ${myDog.address} ${DEPLOYER_ADDR} ${DEPLOYER_ADDR} ${myLogic.address} ${votePeriod} ${voteDelay} ${proposalThresholdPct} ${quorumPct}`);

    await (await vestor.grantRole(MANAGER, myExec.address, gasOptions)).wait();
    log("Treasury/timelock added as vestor MANAGER");
    await (await vestor.grantRole(LAUNCHER, addr.dogBot, gasOptions)).wait();
    log("dogBot added as vestor LAUNCHER");

    await (await myDog.setTreasury(myExec.address, gasOptions)).wait();
    log("treasury set to myExec.address", myExec.address);

    await (await myDog.setreserveDuration(newReserveDuration, gasOptions)).wait();
    log("reserveDuration set to", newReserveDuration);

    await (await myDog.setFlowDelay(flowDelay, gasOptions)).wait();
    log("flowDelay set to", flowDelay);
}

async function extra() {
  const BSCT = await ethers.getContractFactory("BidTokens");
  const myBsct = await BSCT.deploy(bidTokenName, bidTokenSymbol);
  await myBsct.deployed();
  log("BSCT logic deployed to address:", myBsct.address);
  log(`npx hardhat verify --network ${chain} ${myBsct.address} "${bidTokenName}" ${bidTokenSymbol}`);
}

extra()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

// npx hardhat run scripts/deploy2.js --network mumbai
// npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS



