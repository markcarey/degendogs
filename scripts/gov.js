require('dotenv').config();
const API_URL = process.env.API_URL_POLYGON;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DEPLOYER_ADDR = process.env.DEPLOYER_ADDR;
const DEPLOYER_PRIV = process.env.DEPLOYER_PRIV;

var BN = web3.utils.BN;

const signer = new ethers.Wallet(process.env.PK, ethers.provider);
//const signer = new ethers.Wallet(DEPLOYER_PRIV, ethers.provider);
const govAddress = "0x18288e01e2247166d7dF094743a5669BF7fDAaD2";
const govJSON = require("../artifacts/contracts/governance/DegenDAOLogicV1.sol/DegenDAOLogicV1.json");
const gov = new ethers.Contract(govAddress, govJSON.abi, signer);

// Gas
const gasOptions = {"maxPriorityFeePerGas": "45000000000", "maxFeePerGas": "45000000016" };

var addr = {};
addr.idleWETH = "0xfdA25D931258Df948ffecb66b5518299Df6527C4";
addr.vestor = "0xe0159f36b6a09e6407df0c7debac433a77511625";
addr.unknown = "0x00000000E0159f36b6A09E6407dF0c7DEbaC433A";
addr.dogs = "0xa920464b46548930befecca5467860b2b4c2b5b9";
addr.treasury = "0xb6021d0b1e63596911f2cCeEF5c14f2db8f28Ce1";

function encodeParameters(types, values) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
};

async function getProposal(id) {
  const p = await gov.proposals(id);
  console.log(p);
}

async function getProposal(id) {
  const p = await gov.proposals(id);
  console.log(p.calldatas);
  console.log(p);
}

async function state(id) {
  const s = await gov.state(id);
  console.log(s);
}

async function quorumVotes() {
  const q = await gov.quorumVotes();
  console.log(q);
}

async function setVotingPeriod() {
  await (await gov._setVotingPeriod(152000, gasOptions)).wait();
  console.log("done");
}

async function propose() {
  var targets = [addr.dogs, addr.dogs];
  var values = [0,0];
  var signatures = ['safeTransferFrom(address,address,uint256)', 'safeTransferFrom(address,address,uint256)'];
  var callData1 = encodeParameters(['address','address','uint256'], [addr.treasury, '0x0D538d6253Eb5CeBaEf94a873a7d3DF22D6F936c', '79']); 
  var callData2 = encodeParameters(['address','address','uint256'], [addr.treasury, '0x0D538d6253Eb5CeBaEf94a873a7d3DF22D6F936c', '87']); 
  var callDatas = [callData1, callData2];
  var description = "v2 Transfer 2 Dogs to ETHRank";
  await (await gov.propose(targets, values, signatures, callDatas, description, gasOptions)).wait();
  console.log("proposed");
}

async function veto(id) {
  await (await gov.veto(id, gasOptions)).wait();
  console.log("vetoed " + id);
}

async function delegate() {
  var targets = [addr.dogs];
  var values = [0];
  var signatures = ['delegate(address)'];
  var callData1 = encodeParameters(['address'], ['0x09A900eB2ff6e9AcA12d4d1a396DdC9bE0307661']); 
  var callDatas = [callData1];
  var description = "v2 Delegate Treasury Dog Votes";
  await (await gov.propose(targets, values, signatures, callDatas, description, gasOptions)).wait();
  console.log("delegated");
}

async function proposeOLd() {
  var targets = [addr.idleWETH, addr.idleWETH, addr.vestor];
  var values = [0,0,0];
  var signatures = ['approve(address,uint256)', 'approve(address,uint256)', 'deposit(address,uint256)'];
  var callData1 = encodeParameters(['address','uint256'], [addr.unknown, '0']); // 0 idleWETH
  var callData2 = encodeParameters(['address','uint256'], [addr.vestor, '1000000000000000000']); // 1 idleWETH
  var callData3 = encodeParameters(['address','uint256'], [addr.idleWETH, '1000000000000000000']); // 1 idleWETH
  var callDatas = [callData1, callData2, callData3];
  var description = "v3 Approve and Fund Vestor with 1 idleWETH";
  await (await gov.propose(targets, values, signatures, callDatas, description, gasOptions)).wait();
  console.log("proposed");
}

async function fundVestor() {
  var targets = [addr.idleWETH, addr.vestor];
  var values = [0,0];
  var signatures = ['approve(address,uint256)', 'deposit(address,uint256)'];
  var callData1 = encodeParameters(['address','uint256'], [addr.vestor, '10000000000000000000']); // 10 idleWETH
  var callData2 = encodeParameters(['address','uint256'], [addr.idleWETH, '10000000000000000000']); // 10 idleWETH
  var callDatas = [callData1, callData2];
  var description = "Fund NEW Vestor with 10 idleWETH";
  await (await gov.propose(targets, values, signatures, callDatas, description, gasOptions)).wait();
  console.log("proposed");
}

//state(1)
//getProposal(22)
//veto(22)
quorumVotes()
//setVotingPeriod()
//propose()
//delegate()
//fundVestor()

.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});


// npx hardhat run scripts/gov.js --network polygon

