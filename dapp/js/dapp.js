var web3 = AlchemyWeb3.createAlchemyWeb3("wss://eth-kovan.alchemyapi.io/v2/n_mDCfTpJ8I959arPP7PwiOptjubLm57");
var BN = web3.utils.BN;

function abbrAddress(address){
    if (!address) {
        address = ethereum.selectedAddress;
    }
    return "0x..." + address.slice(address.length - 6);
}

const cfaAddress = "0xECa8056809e7e8db04A8fF6e4E82cD889a46FE2F";
const cfa = new web3.eth.Contract(cfaABI, cfaAddress);
const dogAddress = "0x1cA5d36c24B0a31e023Ff0bD8d5b627696d87Cd0";
const dog = new web3.eth.Contract(dogABI, dogAddress);
const auctionAddress = "0xFAe0d03Dba0782B18D68F9849482A9c545a5A68b";
const auction = new web3.eth.Contract(auctionABI, auctionAddress);

var gas = web3.utils.toHex(new BN('2000000000')); // 2 Gwei;
var dappChain;
var userChain;
var accounts;

async function main() {
    dappChain = await web3.eth.getChainId();
    console.log("The chainId is " + dappChain);

    accounts = await web3.eth.getAccounts();
    connectWallet();

    userChain = await ethereum.request({ method: 'eth_chainId' });
    console.log("The chainId of connected account is " + web3.utils.hexToNumber(userChain));

    window.ethereum.on('accountsChanged', function () {
        web3.eth.getAccounts(function (error, accts) {
            console.log(accts[0], 'current account after account change');
            accounts = accts;
            location.reload();
        });
    });

    window.ethereum.on('chainChanged', function () {
      location.reload();
    });
}
main();

function correctChain() {
  var correct = false;
  if (dappChain == userChain) {
    correct = true;
  }
  return correct;
}

async function connectWallet() {
    $("#status").text("Connecting...");
    if (window.ethereum) {
        console.log("window.ethereum true");
        window.ethereum
            .enable()
            .then(async result => {
                // Metamask is ready to go!
                console.log(result);
                accounts = result;
                $(".connect").text(abbrAddress());
                $("#bid-button").prop("disabled", false);
            })
            .catch(reason => {
                // Handle error. Likely the user rejected the login.
            });
    } else {
        // The user doesn't have Metamask installed.
        console.log("window.ethereum false");
    } 
} // connectWallet()

async function auctionEvents(dogId) {
    //const covEventsUrl = "https://api.covalenthq.com/v1/42/events/topics/0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3/?starting-block=27539184&ending-block=latest&sender-address=" + auctionAddress + "&key=ckey_ac7c55f53e19476b85f0a1099af";
    //const response = await fetch(covEventsUrl);
    //var covEvents = await response.json();
    //console.log(covEvents);
    web3.eth.getPastLogs({
        address: auctionAddress,
        topics: ["0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3", web3.utils.toHex(dogId)],
        fromBlock: 27539184
    })
    .then(console.log);
}

async function currentAuction() {
    var a = await auction.methods.auction().call();
    console.log(a);
    $("#dog-image").attr("src", "/images/" + a.dogId + ".png").attr("alt", "Dog " + a.dogId + " is a member of the Degen Dogs Club");
    $("#dog-title").text("Dog " + a.dogId);
    var date = moment.utc(a.startTime, "X").format("MMMM D YYYY");
    $("#dog-date").text(date);
    var currentBid = parseFloat(web3.utils.fromWei(a.amount));
    $(".dog-current-bid").text("Ξ " + currentBid.toFixed(2));
    var minBid = web3.utils.fromWei(a.amount) * 1.1
    $("#dog-min-bid").text(minBid.toFixed(2));
    auctionEvents(a.dogId);
}
currentAuction();


