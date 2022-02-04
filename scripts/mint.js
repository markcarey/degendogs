require('dotenv').config();
const API_URL = process.env.API_URL_POLYGON;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

//const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
//const web3 = createAlchemyWeb3(API_URL);
var BN = web3.utils.BN;

const contract = require("../artifacts/contracts/Dog.sol/Dog.json");
const contractAddress = "0x281E88Ed346bFF38c053c947Bc15575331Da4e79";
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);

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

async function mint() {
  const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce

  //the transaction
  const tx = {
    'from': PUBLIC_KEY,
    'to': contractAddress,
    'nonce': nonce,
    'gas': 500000,
    'data': nftContract.methods.mint().encodeABI()
  };

  const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
  signPromise.then((signedTx) => {

    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
      if (!err) {
        console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
      } else {
        console.log("Something went wrong when submitting your transaction:", err)
      }
    });
  }).catch((err) => {
    console.log("Promise failed:", err);
  });
}

async function getPrice() {
    const price = await nftContract.methods.getLatestPrice().call();
    console.log("The Price is: " + price);
}

//latestExchangeRate
async function latestExchangeRate() {
    const fx = await nftContract.methods.latestExchangeRate().call();
    console.log("The latest ETH to cDAIx FX is: " + fx);
}

async function tokenURI(tokenId) {
    const uri = await nftContract.methods.tokenURI(tokenId).call();
    console.log("The metadata is at: " + uri);
}

async function ownerOf(tokenId) {
  const addr = await nftContract.methods.ownerOf(tokenId).call();
  console.log("The owner is: " + addr);
}

async function swap() {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 300000,
      'data': nftContract.methods.convertExactEthToDai().encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function comp() {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 300000,
      'maxPriorityFeePerGas': 1999999987,
      'data': nftContract.methods.supplyDAIToCompound().encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function upgrade() {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 300000,
      'maxPriorityFeePerGas': 1999999987,
      'data': nftContract.methods.super().encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function withdrawTokens(tokenContract) {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 300000,
      'maxPriorityFeePerGas': 1999999987,
      'data': nftContract.methods.withdrawToken(tokenContract).encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function withdrawETH() {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 300000,
      'maxPriorityFeePerGas': 1999999987,
      'data': nftContract.methods.withdrawETH().encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }


  async function transfer(tokenId, addr) {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 10000000,
      'maxPriorityFeePerGas': 1999999987,
      'data': nftContract.methods.transferFrom(PUBLIC_KEY, addr, tokenId).encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function setStreamonomics() {
    var streams = await nftContract.methods.getStreamonomics().call();
    console.log("Streamonomics: " + JSON.stringify(streams));


    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    var percentage = [20,30,10];
    var start = [0,0,0];
    var step = [1,10,10];
    var limit = [1,5,10];

    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 10000000,
      'maxPriorityFeePerGas': 1999999987,
      'data': nftContract.methods.setStreamonomics(percentage, start, step, limit).encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, async function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 

          streams = await nftContract.methods.getStreamonomics().call();
          console.log("Streamonomics: " + JSON.stringify(streams));

        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }


  async function redirect(from, to, ref) {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 1000000,
      'maxPriorityFeePerGas': 1999999987,
      'data': nftContract.methods.redirectStreams(from, to, ref).encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

//doAllTheDefi
async function defi() {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 1000000,
      'maxPriorityFeePerGas': 1999999987,
      'data': nftContract.methods.doAllTheDefi().encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function claimComp() {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 1000000,
      'maxPriorityFeePerGas': 1999999987,
      'data': nftContract.methods.claimComp().encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

async function issue(newOwner, tokenId, amount) {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 2000000,
      'data': nftContract.methods.issue(newOwner, tokenId, amount).encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function setMinter(minter) {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 2000000,
      'data': nftContract.methods.setMinter(minter).encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function setTreasury(addr) {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 2000000,
      'data': nftContract.methods.setTreasury(addr).encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function setTokenURI(uri, id) {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 3000000,
      'data': nftContract.methods.setTokenURI(uri, id).encodeABI()
    };
  
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise.then((signedTx) => {
  
      web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash, "\nCheck Alchemy's Mempool to view the status of your transaction!"); 
        } else {
          console.log("Something went wrong when submitting your transaction:", err)
        }
      });
    }).catch((err) => {
      console.log("Promise failed:", err);
    });
  }

  async function getSome(token, eoa) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [eoa],
    });
    const signer = await ethers.getSigner(eoa);
    let contract = new ethers.Contract(
      token,
      ERC20abi,
      signer
    );
    var bal = contract.balanceOf(eoa);
    await contract.transfer(PUBLIC_KEY, bal).then((transferResult) => {
      console.log(transferResult);
    });
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [eoa],
    });
  }

//mint(); //"19290123456790"); // 50 per month
//issue("0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D", 0, "1000000000000000000"); // Dog Master
//issue("0x0F74e1B1b88Dfe9DE2dd5d066BE94345ab0590F1", 1, "100000000000000000"); // NFT Words
//issue("0x09A900eB2ff6e9AcA12d4d1a396DdC9bE0307661", 2, "100000000000000000"); 
//issue("0x0F74e1B1b88Dfe9DE2dd5d066BE94345ab0590F1", 3, "1000000000000000000"); // NFT Words
//issue("0x5dbCaC6c76bd32497B652D1afFf959B3f83B53e1", 4); // Jerry
//getPrice();
//swap();
//comp();
//withdrawTokens("0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa"); // DAI
//withdrawTokens("0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD"); // cDAI
//withdrawTokens("0x3ED99f859D586e043304ba80d8fAe201D4876D57"); // cDAIx
//withdrawTokens("0x61460874a7196d6a22D1eE4922473664b3E95270"); // COMP
//withdrawTokens("0xd0A1E359811322d97991E03f863a0C30C2cF029C"); // WETH
//withdrawETH();
//upgrade();
//defi();
//claimComp();
//latestExchangeRate();
//setMinter("0xba85aBe9A942FC17a89932c21733e4c982234DaB");
//tokenURI(1);
//setTokenURI("", 1);
//transfer(0, "0xD89311d9613b6b3Fc45E2Ba64E4d8B5161Dc4c58");
//setStreamonomics();
//setTreasury("0x369e06C46790d7174Bd96Da75Db5c2977647Ce11");
//ownerOf(0);
//getSome("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", "0x5c5a4ae893c4232a050b01a84e193e107dd80ca2");
getSome("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", "0x72A53cDBBcc1b9efa39c834A540550e23463AAcB");

