require('dotenv').config();
const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(API_URL);
var BN = web3.utils.BN;

const contract = require("../artifacts/contracts/Dog.sol/Dog.json");
const contractAddress = "0x1cA5d36c24B0a31e023Ff0bD8d5b627696d87Cd0";
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);

async function mint() {
  const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce

  //the transaction
  const tx = {
    'from': PUBLIC_KEY,
    'to': contractAddress,
    'nonce': nonce,
    'gas': 500000,
    'maxPriorityFeePerGas': 1999999987,
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

async function swap() {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); //get latest nonce
  
    //the transaction
    const tx = {
      'from': PUBLIC_KEY,
      'to': contractAddress,
      'nonce': nonce,
      'gas': 300000,
      'maxPriorityFeePerGas': 1999999987,
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
      'maxPriorityFeePerGas': 1999999987,
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
      'maxPriorityFeePerGas': 1999999987,
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

//mint(); //"19290123456790"); // 50 per month
//issue("0x09A900eB2ff6e9AcA12d4d1a396DdC9bE0307661", 0, "1000000000000000000");
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
//setMinter("0xFAe0d03Dba0782B18D68F9849482A9c545a5A68b");
tokenURI(1);
