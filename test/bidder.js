const { expect } = require("chai");
const { ethers } = require("hardhat");

require('dotenv').config();
const API_URL = process.env.API_URL_POLYGON;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DEPLOYER_PRIV = process.env.DEPLOYER_PRIV;

var BN = web3.utils.BN;

const signer = new ethers.Wallet(DEPLOYER_PRIV, ethers.provider);
var bidderAddress = "0x72b0aD009C275407873e5bc6eC7d9c382CA289Ed"; //localhost:polygon
const ahAddress = "0xc9f32fc6aa9f4d3d734b1b3fec739d55c2f1c1a7";
const dogsAddress = "0xa920464b46548930befecca5467860b2b4c2b5b9";
const treasuryAddress = "0xb6021d0b1e63596911f2cceef5c14f2db8f28ce1";
const wethAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const BSCTaddress = "0x600e5f4920f90132725b43412d47a76bc2219f92";

const bidderJSON = require("../artifacts/contracts/AuctionBidder.sol/AuctionBidder.json");
const houseJSON = require("../artifacts/contracts/DogsAuctionHouse.sol/DogsAuctionHouse.json");
const bsctJSON = require("../artifacts/contracts/BidTokens.sol/BidTokens.json");
const dogJSON = require("../artifacts/contracts/Dog.sol/Dog.json");
var bidder; // = new ethers.Contract(bidderAddress, bidderJSON.abi, signer);
const auctionHouse = new ethers.Contract(ahAddress, houseJSON.abi, signer);
const WETH = new ethers.Contract(wethAddress, bsctJSON.abi, signer);
const BSCT = new ethers.Contract(BSCTaddress, bsctJSON.abi, signer);
const DOG = new ethers.Contract(dogsAddress, dogJSON.abi, signer);


describe.only("Test Bidder Contract", function() {

  before('Deploy Contracts', async function() {
    // runs once before the first test in this block
    this.timeout(2400000);
    //await hre.network.provider.send("hardhat_reset");
    const Bidder = await ethers.getContractFactory("AuctionBidder");
    bidder = await Bidder.deploy(ahAddress, treasuryAddress, wethAddress, dogsAddress);
    await bidder.deployed();
    console.log("Bidder deployed to address:", bidder.address);
  });

  it("should set maxBid", async function() {
    var amt = "200000000000000000";
    await ( await bidder.setMaxBid(amt) ).wait();
    var maxBid = await bidder.maxBid();
    console.log(maxBid);
    expect(maxBid).to.equal(amt);
  });

  it("should set minBid", async function() {
    var amt = "100000000000000000";
    await ( await bidder.setMinBid(amt) ).wait();
    var minBid = await bidder.minBid();
    console.log(minBid);
    expect(minBid).to.equal(amt);
  });

  it("should fund contract", async function(){
    const eoa = "0x72A53cDBBcc1b9efa39c834A540550e23463AAcB";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [eoa],
    });
    const signer = await ethers.getSigner(eoa);
    let contract = new ethers.Contract(
      wethAddress,
      bsctJSON.abi,
      signer
    );
    var bal = await contract.balanceOf(eoa);
    await (await contract.transfer(bidder.address, bal)).wait();
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [eoa],
    });
    const wethBal = await contract.balanceOf(bidder.address);
    expect(parseInt(wethBal)).to.be.gt(0);
  });

  it("should return true for bidReady", async function(){
    expect(await bidder.bidReady()).to.equal(true);
  });

  it("should submit bid", async function() {
    var auction = await auctionHouse.auction();
    var bid = auction.amount;
    await ( await bidder.bid() ).wait();
    auction = await auctionHouse.auction();
    console.log(auction);
    expect(auction.amount).to.be.gt(bid);
    expect(auction.bidder).to.equal(bidder.address);
  });

  it("should transfer BSCT to treasury", async function(){
    var bidderBal = await BSCT.balanceOf(bidder.address);
    var treasuryBal = await BSCT.balanceOf(treasuryAddress);
    expect(parseInt(bidderBal)).to.be.gt(0);
    await ( await bidder.transferERC20(BSCTaddress) ).wait();
    expect(await BSCT.balanceOf(bidder.address)).to.equal(0);
    expect(await BSCT.balanceOf(treasuryAddress)).to.be.gt(treasuryBal);
  });

  it("should revert transfering WETH using transferERC20", async function(){
    var bidderBal = await WETH.balanceOf(bidder.address);
    var treasuryBal = await WETH.balanceOf(treasuryAddress);
    expect(parseInt(bidderBal)).to.be.gt(0);
    await expect(bidder.transferERC20(wethAddress))
      .to.be.revertedWith('use transferWETH function');
  });

  it("should transfer WETH to treasury", async function(){
    var bidderBal = await WETH.balanceOf(bidder.address);
    var treasuryBal = await WETH.balanceOf(treasuryAddress);
    expect(parseInt(bidderBal)).to.be.gt(0);
    await ( await bidder.transferWETH() ).wait();
    expect(await WETH.balanceOf(bidder.address)).to.equal(0);
    expect(await WETH.balanceOf(treasuryAddress)).to.be.gt(treasuryBal);
  });

  it("should transfer Dog to treasury", async function(){
    this.timeout(2400000);
    var auction = await auctionHouse.auction();
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [parseInt(auction.endTime) + 10],
    });
    var tx = await auctionHouse.settleCurrentAndCreateNewAuction();
    await expect(tx)
      .to.emit(auctionHouse, 'AuctionSettled');
    await (await bidder.transferDog(auction.dogId)).wait();
    expect(await DOG.ownerOf(auction.dogId))
      .to.equal(treasuryAddress); 
  });

});




