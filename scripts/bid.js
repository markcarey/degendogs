require('dotenv').config();
const API_URL = process.env.API_URL_POLYGON;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DEPLOYER_PRIV = process.env.DEPLOYER_PRIV;

var BN = web3.utils.BN;

const signer = new ethers.Wallet(DEPLOYER_PRIV, ethers.provider);
var bidderAddress = "0xF15cF7718988bf8F4d013aC90dFE31C7105C9272"; //localhost:polygon
const ahAddress = "0xc9f32fc6aa9f4d3d734b1b3fec739d55c2f1c1a7";
const dogsAddress = "0xa920464b46548930befecca5467860b2b4c2b5b9";
const treasuryAddress = "0xb6021d0b1e63596911f2cceef5c14f2db8f28ce1";
const wethAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const BSCT = "0x600e5f4920f90132725b43412d47a76bc2219f92";

const bidderJSON = require("../artifacts/contracts/AuctionBidder.sol/AuctionBidder.json");
const bidder = new ethers.Contract(bidderAddress, bidderJSON.abi, signer);

async function deployBidder() {
  const Bidder = await ethers.getContractFactory("AuctionBidder");
  const myBidder = await Bidder.deploy(ahAddress, treasuryAddress, wethAddress, dogsAddress);
  await myBidder.deployed();
  console.log("Bidder deployed to address:", myBidder.address);
}

async function bidReady() {
  const ready = await bidder.bidReady();
  console.log(ready);
}

async function setMinBid(amt) {
  await ( await bidder.setMinBid(amt) ).wait();
  var minBid = await bidder.minBid();
  console.log(minBid);
}

async function setMaxBid(amt) {
  await ( await bidder.setMaxBid(amt) ).wait();
  var maxBid = await bidder.maxBid();
  console.log(maxBid);
}

async function bid() {
  await ( await bidder.bid() ).wait();
  console.log("bid submitted");
}

async function transferERC20(token) {
  await ( await bidder.transferERC20(token) ).wait();
  console.log("transferred");
}

async function transferDog(dogId) {
  await (await bidder.transferDog(dogId)).wait();
  console.log("transferred");
}

//deployBidder()
//bidReady()
//setMinBid("")
//setMaxBid("200000000000000000") // 0.2 WETH
//bid()
//transferERC20(BSCT)
transferDog(79)

.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});




