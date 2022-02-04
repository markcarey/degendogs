require('dotenv').config();
const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MANAGER = web3.utils.keccak256("MANAGER_ROLE");

const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider);

var addr = {};
var chain = "mumbai";
if (chain == "polygon") {
  addr.vestor = "0xdbdF8EA5C514bd1ca8A294a1e6C361502592E457"; // localhost:polygon
  addr.donation = "0x81D0D2b927D1FdE461Bb43Ec38993C6359a40942"; // localhost:polygon
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

async function main() {
    const vestorAddress = "0x8f678d16918bc16F9EB23259a8A7D4c2Baa26B4e"; // localhost:polygon
    const donationAddress = "0x47D057a7720A41a40C79Ea1c514A320F2972eCA6"; // localhost:polygon
    //const WETH = "0x3C68CE8504087f89c640D02d133646d98e64ddd9"; // mumbai
    const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // polygon
    const name = "Degen Dogs";
    const symbol = "DOG";
    const baseURI = "https://api.degendogs.club/meta/";
    const idleWETH = "0xfdA25D931258Df948ffecb66b5518299Df6527C4"; // polygon
    const bidTokenName = "Dog Biscuits";
    const bidTokenSymbol = "BSCT";

    const dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // TODO: change this

    //const mock = await ethers.getContractFactory("IdleWETH");
    //const mockIdleWETH = await mock.deploy();
    //console.log("mockIdleWETH deployed to address:", mockIdleWETH.address);
    //return;


    // Grab the contract factory 
    const Dog = await ethers.getContractFactory("Dog");
    const House = await ethers.getContractFactory("DogsAuctionHouse");

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

    let vestor = new ethers.Contract(
      addr.vestor,
      vestorABI,
      signer
    );
 
    // Start deployment, returning a promise that resolves to a contract object
    const myDog = await Dog.deploy(addr.vestor, addr.donation, addr.WETH, addr.idleWETH, addr.dogMaster, name, symbol, baseURI); // Instance of the contract 
    console.log("Dog deployed to address:", myDog.address);

    await (await vestor.grantRole(MANAGER, myDog.address)).wait();
    console.log("Dog added as vestor MANAGER");

    const auctionHouse = await House.deploy(); // Instance of the contract 
    console.log("Auction House deployed to address:", auctionHouse.address);
    await (await auctionHouse.initialize(myDog.address, addr.WETH, 60*1, "100000000000000000", 10, 60*5, bidTokenName, bidTokenSymbol)).wait();
    console.log("Auction house initialized");

    await (await myDog.setMinter(auctionHouse.address)).wait();
    console.log("Minter set");

    await (await auctionHouse.unpause()).wait();
    console.log("Auction House Unpaused");

    const Exec = await ethers.getContractFactory("DegenDAOExecutor");
    const myExec = await Exec.deploy(PUBLIC_KEY, 3);
    console.log("Executor deployed to address:", myExec.address);
    
    const Logic = await ethers.getContractFactory("DegenDAOLogicV1");
    const myLogic = await Logic.deploy();
    console.log("Logic deployed to address:", myLogic.address);
    //await myLogic.initialize(myExec.address,myDog.address,"0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D",5760,1,1,200);

    const Proxy = await ethers.getContractFactory("DegenDAOProxy");
    const myProxy = await Proxy.deploy(myExec.address,myDog.address, PUBLIC_KEY, PUBLIC_KEY,myLogic.address,5760,1,1,200,{ gasLimit: 5000000 });
    console.log("Proxy deployed to address:", myProxy.address);
 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });

// npx hardhat run scripts/deploy.js --network mumbai
// npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"