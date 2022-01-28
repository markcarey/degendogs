const { expect } = require("chai");
const { ethers } = require("hardhat");

require('dotenv').config();
const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MANAGER = web3.utils.keccak256("MANAGER_ROLE");

const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider);

var addr = {};
var chain = "mumbai";
if (chain == "polygon") {
  addr.vestor = "0x8f678d16918bc16F9EB23259a8A7D4c2Baa26B4e"; // localhost:polygon
  addr.donation = "0x47D057a7720A41a40C79Ea1c514A320F2972eCA6"; // localhost:polygon
  addr.WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // polygon
  addr.idleWETH = "0xfdA25D931258Df948ffecb66b5518299Df6527C4"; // polygon
  addr.dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // TODO: change this
}
if (chain == "mumbai") {
  //Mumbai:
  addr.vestor = "0xd718d66D0917f80Af45dC13d58001541FB865FCe"; // mumbai for mock idleWETH
  addr.donation = "0x38a9E2F074a1dd08249F7D2fb8B31b8661D1920B"; // mumbai
  addr.WETH = "0x3C68CE8504087f89c640D02d133646d98e64ddd9"; 
  addr.idleWETH = "0x490B8896ff200D32a100A05B7c0507E492938BBb"; // MOCK
  addr.dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // TODO: change this
}

const name = "Degen Dogs";
const symbol = "DOG";
const baseURI = "https://api.degendogs.club/meta/";
const idleWETH = "0xfdA25D931258Df948ffecb66b5518299Df6527C4"; // polygon
const bidTokenName = "Dog Biscuits";
const bidTokenSymbol = "BSCT";
const dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // TODO: change this

var myDog, auctionHouse, myExec, myLogic, myProxy, vestor;

before('Deploy Contracts', async function () {
    // runs once before the first test in this block
    this.timeout(60000);
    const Dog = await ethers.getContractFactory("Dog");
    const House = await ethers.getContractFactory("DogsAuctionHouse");
    const Exec = await ethers.getContractFactory("DegenDAOExecutor");
    const Logic = await ethers.getContractFactory("DegenDAOLogicV1");
    const Proxy = await ethers.getContractFactory("DegenDAOProxy");

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
              "name": "recipientAddresses",
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
              "name": "recipientAddresses",
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

    const myExec = await Exec.deploy(PUBLIC_KEY, 3);
    await myExec.deployed();
    console.log("Executor deployed to address:", myExec.address);
    
    const myLogic = await Logic.deploy();
    await myLogic.deployed();
    console.log("Logic deployed to address:", myLogic.address);

    const myProxy = await Proxy.deploy(myExec.address,myDog.address, PUBLIC_KEY, PUBLIC_KEY,myLogic.address,5760,1,1,200,{ gasLimit: 5000000 });
    await myProxy.deployed();
    console.log("Proxy deployed to address:", myProxy.address);
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
  
    it("Should start the first auction for Dog #1", async function () {
        var auction = await auctionHouse.auction();
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

    it("Should set Duration and emit AuctionDurationUpdated", async function () {
        await expect(auctionHouse.setDuration(60*60*3))
            .to.emit(auctionHouse, 'AuctionDurationUpdated')
            .withArgs(60*60*3);
        expect(parseInt(await auctionHouse.duration())).to.equal(60*60*3);
    });

    it("Should set Reserve price and emit AuctionReservePriceUpdated", async function () {
        await expect(auctionHouse.setReservePrice("110000000000000000"))
            .to.emit(auctionHouse, 'AuctionReservePriceUpdated')
            .withArgs("110000000000000000");
        expect((await auctionHouse.reservePrice()).toString()).to.equal("110000000000000000");
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

    


});