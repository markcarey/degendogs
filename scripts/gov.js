require('dotenv').config();
const API_URL = process.env.API_URL_POLYGON;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

var BN = web3.utils.BN;

const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider);
const govAddress = "0x18288e01e2247166d7dF094743a5669BF7fDAaD2";
const govJSON = require("../artifacts/contracts/governance/DegenDAOLogicV1.sol/DegenDAOLogicV1.json");
const gov = new ethers.Contract(govAddress, govJSON.abi, signer);

async function getProposal(id) {
  const p = await gov.proposals(id);
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

//state(1)
//getProposal(2)
quorumVotes()

.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});




