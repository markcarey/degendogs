
const fetch = require('node-fetch');


const { ethers } = require("ethers");
const VESTOR_ADDR = process.env.VESTOR_ADDR;

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const PUBLIC_KEY = BOT_ADDR;
const prov = {"url": RPC_URL};
var provider = new ethers.providers.JsonRpcProvider(prov);
const vestorAddress = VESTOR_ADDR;
const vestorJSON = require(__base + 'degendogs/vestor.json');

var signer, vestor;

var gasOptions = {"maxPriorityFeePerGas": "45000000000", "maxFeePerGas": "45000000016" };

// updated April, 3, 2023:
const recipients = [
    'redacted array of recipient addresses'
];


function getContracts(pk) {
  signer = new ethers.Wallet(pk, provider);
  vestor = new ethers.Contract(
    vestorAddress,
    vestorJSON.abi,
    signer
  );
}

async function getGasPrices() {
  return new Promise(async (resolve, reject) => {
    var res = await fetch('https://gasstation-mainnet.matic.network/v2');
    var gas = await res.json();
    console.log(gas);
    let block_number = gas.blockNumber;
    let base_fee = parseFloat(gas.estimatedBaseFee);
    let max_priority_fee = gas.standard.maxPriorityFee;
    let max_fee_per_gas = base_fee + max_priority_fee;

    max_fee_per_gas += (base_fee * 0.1);

    console.log(`block_number: ${block_number}`);
    console.log(`base_fee: ${base_fee.toFixed(9)} gwei`);
    console.log(`max_priority_fee_per_gas: ${max_priority_fee} gwei`);
    console.log(`max_fee_per_gas: ${max_fee_per_gas} gwei`);

    // cast gwei numbers to wei BigNumbers for ethers
    const maxFeePerGas = ethers.utils.parseUnits(max_fee_per_gas.toFixed(9), 'gwei');
    const maxPriorityFeePerGas = ethers.utils.parseUnits(max_priority_fee.toFixed(9), 'gwei');

    // Final object ready to feed into a transaction
    const gasOptions = {
        maxFeePerGas,
        maxPriorityFeePerGas
    }
    resolve(gasOptions);
  });
}



module.exports = {

  "cronCloser": async function(context) {
    console.log('This will be run every 60 minutes!');
    const currentDate = new Date().getTime() / 1000;
    getContracts(process.env.DD_BOT_PK);
    //var recipients = await vestor.getAllAddresses();
    console.log("recipients", JSON.stringify(recipients));
    recipient:
    for (let i = 0; i < recipients.length; i++) {
      var adr = recipients[i];
      var flowsForAddress = await vestor.getFlowRecipient(adr);
      console.log("flowsForAddress", JSON.stringify(flowsForAddress));
      flow:
      for (let flowIndex = 0; flowIndex < flowsForAddress.length; flowIndex++) {
        var flow = flowsForAddress[flowIndex];
        flow.flowIndex = flowIndex;
        if (parseInt(flow.state) != 1) {
          // flow either stopped or not yet started
          console.log("flow is not flowing, skip it", console.log(JSON.stringify(flow)));
          continue flow;
        }
        if (parseInt(flow.starttime) == 0) {
          // flow not yet started
          console.log("flow has not started, skip it", console.log(JSON.stringify(flow)));
          continue flow;
        }
        var endDate = parseInt(flow.starttime) + parseInt(flow.vestingDuration);
        if (endDate > currentDate) {
          // not yet time to close this flow
          console.log("flow is not ready to close", console.log(JSON.stringify(flow)));
          continue flow;
        } else {
          // this flow is ready to close
          console.log("flow is READY to close", flowIndex, console.log(JSON.stringify(flow)));
          const gasPrices = await getGasPrices();
          console.log("gasPrices", JSON.stringify(gasPrices));
          if (gasPrices) {
            gasOptions = gasPrices;
          }
          await (await vestor.closeStream(flow.recipient, flowIndex, gasOptions)).wait();
          const msg = `flowIndex ${flowIndex} to ${flow.recipient} has been closed`;
          await fetch(process.env.POLLY_URL + encodeURIComponent(msg));
        }
      } // for each flow for specific recipient address
    } // for each recipient address

  }, // cronCloser


}; // module.exports

