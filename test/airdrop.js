const { expect } = require("chai");
const { ethers } = require("hardhat");
//import hre from 'hardhat';

const networkName = hre.network.name;
console.log(networkName);

require('dotenv').config();
var BN = web3.utils.BN;
const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DEPLOYER_ADDR = process.env.DEPLOYER_ADDR;
const DEPLOYER_PRIV = process.env.DEPLOYER_PRIV;


const dogJSON = require("../artifacts/contracts/Dog.sol/Dog.json");
const houseJSON = require("../artifacts/contracts/DogsAuctionHouse.sol/DogsAuctionHouse.json");
const govJSON = require("../artifacts/contracts/governance/DegenDAOLogicV1.sol/DegenDAOLogicV1.json");

const newDonationPercentage = 0;

// Auction Settings
const minBid = "5000000000000000"; // 0.005 ETH

// Quroum is 40 votes
var voters = [
  "0x09A900eB2ff6e9AcA12d4d1a396DdC9bE0307661", // 20 votes
  "0x2E62Ee3af78d005a0DffB116295b13EF45b6F2C0", // 16 votes
  "0xbd819B297E4F42d595B17F3e565896ab31867488" // 6 votes
];

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

  addr.dog = "0xA920464B46548930bEfECcA5467860B2b4C2B5b9"; // deployed address
  addr.gov = "0x18288e01e2247166d7dF094743a5669BF7fDAaD2"; // deployed address (proxy)
  addr.auctionHouse = "0xC9F32Fc6aa9F4D3d734B1b3feC739d55c2f1C1A7"; // deployed address
  addr.treasury = "0xb6021d0b1e63596911f2cCeEF5c14f2db8f28Ce1"; // deployed address
}

var myDog, auctionHouse, gov, airdrop;
var chainTime;

// Governance Settings
var polygonBlocksPerDay = 38000;
var votePeriod = polygonBlocksPerDay * 7;  // blocks --- ~7 days
var voteDelay = 1; // blocks --- allow votes immediately after proposal submitted

const debug = false;
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

describe("Degen Dog Airdrop and Auction Settings", function () {

  it('should deploy Airdrop contract', async function () {
      // runs once before the first test in this block
      this.timeout(2400000);
      network = await ethers.provider.getNetwork();
      log(network.chainId);
      const Airdrop = await ethers.getContractFactory("Airdrop");
      airdrop = await Airdrop.deploy();
      addr.airdrop = airdrop.address;
      log("Airdrop deployed to address:", airdrop.address);

      // already deployed
      myDog = new ethers.Contract(addr.dog, dogJSON.abi, signer);
      auctionHouse = new ethers.Contract(addr.auctionHouse, houseJSON.abi, signer);
      gov = new ethers.Contract(addr.gov, govJSON.abi, signer);
  });

  describe("Auction House", function () {

      it("should pause AuctionHouse", async function(){
        await expect(auctionHouse.pause())
              .to.emit(auctionHouse, 'Paused')
      });

  });


  describe("Governance", function () {

    before("load gov proxy with implementation abi", async function(){
      network = await ethers.provider.getNetwork();
      gov = new ethers.Contract(addr.gov, govJSON.abi, signer);
    });


    it('Should create proposal with 4 txns', async function () {
      var targets = [];
      var values = [];
      var signatures = [];
      var callDatas = [];

      // Txn 1: Redeem 13 idleWETH to WETH
      targets.push(addr.idleWETH);
      values.push(0);
      signatures.push('redeemIdleToken(uint256)');
      callDatas.push(encodeParameters(['uint256'], ['13000000000000000000']));

      // Txn 2: Approve 13 WETH to Airdrop contract
      targets.push(addr.WETH);
      values.push(0);
      signatures.push('approve(address,uint256)');
      callDatas.push(encodeParameters(['address','uint256'], [addr.airdrop, '13000000000000000000']));

      // Txn 3: SetApprovalForAll() to Aridrop contract for Dog contract
      targets.push(addr.dog);
      values.push(0);
      signatures.push('setApprovalForAll(address,bool)');
      callDatas.push(encodeParameters(['address','bool'], [addr.airdrop, true]));

      var description = "1. Downgrade 13 idleWETHx to idleWETH. 2. Redeem 13 idleWETH to WETH. 3. Approve 13 WETH to Airdrop contract. 4. SetApprovalForAll() to Aridrop contract for Dog contract";
      const pCount = await gov.proposalCount();

      // proposer must have votes:
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [voters[0]]
      });
      var proposerSigner = await ethers.getSigner(voters[0]);

      await expect(gov.connect(proposerSigner).propose(targets, values, signatures, callDatas, description))
              .to.emit(gov, 'ProposalCreated');
      const id = await gov.proposalCount();
      log("proposal id", id);
      expect(id - pCount).to.equal(1);
    });

    it('Should submit votes FOR proposal', async function () {
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
        await hre.network.provider.send("hardhat_mine", [ethers.utils.hexStripZeros(ethers.utils.hexlify(blocks)), ethers.utils.hexStripZeros(ethers.utils.hexlify(2))]);
      }
      for (let i = 0; i < voters.length; i++) {
        // impersonate voter with hardhat
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [voters[i]]
        });
        var voterSigner = await ethers.getSigner(voters[i]);
        await expect(gov.connect(voterSigner).castVote(id, support))
              .to.emit(gov, 'VoteCast');
        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [voters[i]]
        });
      }
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
      await hre.network.provider.send("hardhat_mine", [ethers.utils.hexStripZeros(ethers.utils.hexlify(blocks)), ethers.utils.hexStripZeros(ethers.utils.hexlify(2))]);
      await expect(gov.connect(signer).queue(id))
              .to.emit(gov, 'ProposalQueued');
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
      await expect(gov.execute(id))
              .to.emit(gov, 'ProposalExecuted');
    });


  });

  describe("Airdrop", function () {

    var claimerSigner;

    before("impesonate airpdrop recipient", async function(){
      // claimer must be listed in Airdrop contract:
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [voters[1]]
      });
      claimerSigner = await ethers.getSigner(voters[1]);
    });

    it("should be owed WETH", async function(){
      const owed = await airdrop.wethOwed(claimerSigner.address);
      expect(parseInt(owed)).to.be.gt(0);
    });

    it("should claim WETH", async function(){
      const weth = new ethers.Contract(addr.WETH, ERC20abi, claimerSigner);
      var before = await weth.balanceOf(claimerSigner.address);
      await (await airdrop.connect(claimerSigner).claimWETH(claimerSigner.address)).wait();
      var after = await weth.balanceOf(claimerSigner.address);
      expect(parseInt(after)).to.be.gt(parseInt(before));
    });

    it("should NOT be owed WETH", async function(){
      const owed = await airdrop.wethOwed(claimerSigner.address);
      expect(parseInt(owed)).to.be.equal(0);
    });

    var dogsOwed = 0;

    it("should be owed at least one Dog", async function(){
      dogsOwed = await airdrop.dogsOwed(claimerSigner.address);
      //console.log("dogsOwed", dogsOwed);
      expect(parseInt(dogsOwed)).to.be.gt(0);
    });

    it("should claim Dog", async function(){
      this.timeout(400000000);
      const tokenId = 178;  // owned by treasury
      await (await airdrop.connect(claimerSigner).claimDog(claimerSigner.address, tokenId)).wait();
      var owner = await myDog.ownerOf(tokenId);
      expect(owner).to.equal(claimerSigner.address);
    });

    it("should be owed ONE LESS Dog", async function(){
      const newDogsOwed = await airdrop.dogsOwed(claimerSigner.address);
      //console.log("newDogsOwed", newDogsOwed);
      expect(parseInt(dogsOwed)).to.equal(parseInt(newDogsOwed) + 1);
    });

    it("should claim ANOTHER Dog", async function(){
      this.timeout(2400000);
      dogsOwed = await airdrop.dogsOwed(claimerSigner.address);
      //console.log("dogsOwed", dogsOwed);
      const tokenId = 173;  // owned by treasury
      await (await airdrop.connect(claimerSigner).claimDog(claimerSigner.address, tokenId)).wait();
      var owner = await myDog.ownerOf(tokenId);
      expect(owner).to.equal(claimerSigner.address);
    });

    it("should be owed ONE LESS Dog", async function(){
      const newDogsOwed = await airdrop.dogsOwed(claimerSigner.address);
      //console.log("newDogsOwed", newDogsOwed);
      expect(parseInt(dogsOwed)).to.equal(parseInt(newDogsOwed) + 1);
    });

  });

  describe("Dog", function () {

    it("Should set donation percentage", async function () {
      const don = await myDog.donationPercentage();
      await expect(myDog.setDonationPercentage(newDonationPercentage))
          .to.emit(myDog, 'DonationPercentageUpdated')
          .withArgs(don, newDonationPercentage);
      expect(parseInt(await myDog.donationPercentage())).to.equal(newDonationPercentage);
    });

  });

  describe("Auction House", function () {

    it("Should set Reserve price and emit AuctionReservePriceUpdated", async function () {
      await expect(auctionHouse.setReservePrice(minBid))
          .to.emit(auctionHouse, 'AuctionReservePriceUpdated')
          .withArgs(minBid);
      expect((await auctionHouse.reservePrice()).toString()).to.equal(minBid.toString());
    });

    it("should unpause AuctionHouse", async function(){
      await expect(auctionHouse.unpause())
            .to.emit(auctionHouse, 'Unpaused')
    });

  });

});



