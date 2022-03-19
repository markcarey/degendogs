//var web3 = AlchemyWeb3.createAlchemyWeb3("wss://polygon-mumbai.g.alchemy.com/v2/Ptsa6JdQQUtTbRGM1Elvw_ed3cTszLoj");
var chain = "polygon";

var rpcURLs = {};
rpcURLs.rinkeby = "eth-rinkeby.alchemyapi.io/v2/n_mDCfTpJ8I959arPP7PwiOptjubLm57";
rpcURLs.mumbai = "polygon-mumbai.g.alchemy.com/v2/Ptsa6JdQQUtTbRGM1Elvw_ed3cTszLoj";
rpcURLs.polygon = "polygon-mainnet.g.alchemy.com/v2/Ptsa6JdQQUtTbRGM1Elvw_ed3cTszLoj";
rpcURLs.ethereum = "eth-mainnet.alchemyapi.io/v2/n_mDCfTpJ8I959arPP7PwiOptjubLm57";

//rpcURLs.polygon = "localhost:8545";  // CHANGE THIS!!!!!!
var rpcURL = rpcURLs[chain];

const prov = {"url": "https://" + rpcURL};
//const prov = {"url": "http://" + rpcURL};       // localhost only
var provider = new ethers.providers.JsonRpcProvider(prov);

if ("ethereum" in window) {
    // Metamask provider
    provider = new ethers.providers.Web3Provider(window.ethereum);
}

var ensProvider = new ethers.providers.JsonRpcProvider({"url": "https://" + rpcURLs.ethereum});

var web3 = AlchemyWeb3.createAlchemyWeb3("wss://" + rpcURL);
//var web3 = AlchemyWeb3.createAlchemyWeb3("http://localhost:8545");

var BN = web3.utils.BN;
var paused;

var addr = {};
if (chain == "polygon") {
  addr.dog = "0xA920464B46548930bEfECcA5467860B2b4C2B5b9";
  addr.auction = "0xC9F32Fc6aa9F4D3d734B1b3feC739d55c2f1C1A7";
  addr.treasury = "0xb6021d0b1e63596911f2cCeEF5c14f2db8f28Ce1";
  addr.BSCT = "0x600e5F4920f90132725b43412D47A76bC2219F92";
  addr.vestorFactory = "0x70210B719b90BcA3D81cb8026BFC8677F65EB1d7"; // polygon
  addr.vestor = "0xE0159F36b6A09e6407dF0c7debAc433a77511625"; // polygon
  addr.donation = "0x22B5CD016C8D9c6aC5338Cc08174a7FA824Bc5E4"; // polygon --> Unchain Ukraine
  addr.unchain = "0xb37b3b78022E6964fe80030C9161525880274010"; // polygon gnosis safe for Unchain Ukraine
  addr.WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // polygon
  addr.idleWETH = "0xfdA25D931258Df948ffecb66b5518299Df6527C4"; // polygon
  addr.idleWETHx = "0xEB5748f9798B11aF79F892F344F585E3a88aA784"; // polygon
  addr.dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // TODO: change this
  addr.dogBot = "0xFe341be90f9c2Cc7e65Ef4e820f632aB6495b85E";
  addr.SuperHost = "0x3E14dC1b13c488a8d5D310918780c983bD5982E7";
  addr.cfa = "0x6EeE6060f715257b970700bc2656De21dEdF074C";
}
if (chain == "mumbai") {
  //Mumbai:
  addr.dog = "0xee5Abdd54594FD940F9773eC93a5305D67946DD2";
  addr.auction = "0x284348D2aa19D9ab302F0A1b6A1AE2ee8636943E";
  addr.treasury = "0x9ad0cD8c7Eb9d34C7EFDF85D782D4a3684Fc3cAF";
  addr.BSCT = "0x697e51284a501b51550A3AC34805F566beDD749B";
  addr.vestorFactory = "0xeb45B0eB67a4733E36c4d2aC55554EdF7e156dac";
  addr.vestor = "0x7E7d1e788915Bf38dBCF5A48102075Ad30b0E229"; // mumbai for mock idleWETH
  addr.donation = "0x4C30BBf9b39679e6Df06b444435f4b75CF20603e"; // mumbai: Ukraine.sol
  addr.unchain = "0xb37b3b78022E6964fe80030C9161525880274010"; // polygon gnosis safe for Unchain Ukraine
  addr.WETH = "0x3C68CE8504087f89c640D02d133646d98e64ddd9"; 
  addr.idleWETH = "0x490B8896ff200D32a100A05B7c0507E492938BBb"; // MOCK
  addr.idleWETHx = "0x0CCe2C9980711ddc5AA725AF68A10960E49Fd2Ed"; // wrap of MOCK
  addr.dogMaster = "0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D"; // TODO: change this
  addr.dogBot = "0xFe341be90f9c2Cc7e65Ef4e820f632aB6495b85E";
  addr.SuperHost = "0xEB796bdb90fFA0f28255275e16936D25d3418603";
  addr.cfa = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873";
}

const cfa = new web3.eth.Contract(cfaABI, addr.cfa);
const dog = new web3.eth.Contract(dogABI, addr.dog);
const auction = new web3.eth.Contract(auctionABI, addr.auction);
const WETH = new web3.eth.Contract(tokenABI, addr.WETH);
const idleWETH = new web3.eth.Contract(tokenABI, addr.idleWETH);
const idleWETHx = new web3.eth.Contract(tokenABI, addr.idleWETHx);
const vestor = new web3.eth.Contract(vestorABI, addr.vestor);
const BSCT = new web3.eth.Contract(tokenABI, addr.BSCT);

var gas = web3.utils.toHex(new BN('2000000000')); // 2 Gwei; // TODO: fix for production
var dappChain = 80001; // default to Mumbai
var userChain;
var accounts;
var approved = 0;
var a; // current auction or Dog
var currentDogId;

var ens = {};
//temp:
ens["0xF7C13AD0a87a9329d7dB754dAE372d21309C79e8"] = "rarbg.eth";
ens["0xE0D508b85f5c2E591c6E3Fdc1DD6dbF4e0D13d89"] = "scallop.eth";
ens["0xf55eF19fAC8ce476F6eD4B2b983c24eF890B1Edb"] = "metartx.eth";
ens["0xfE015Cd6bC5e1dFADDC45eDbAeD9Ec32d375426a"] = "weedbit.eth";
ens["0xD0ac50d9F7516be16e2449539394A3967BEa03C7"] = "jingge.eth";
ens["0x09A900eB2ff6e9AcA12d4d1a396DdC9bE0307661"] = "markcarey.eth";
ens["0x09a900eb2ff6e9aca12d4d1a396ddc9be0307661"] = "markcarey.eth";
ens["0xc6FfC3a5Af16fb93c86C75280413Ef7C48D79E36"] = "yieldyak.eth";
ens["0x869eC00FA1DC112917c781942Cc01c68521c415e"] = "corbin.eth";

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

async function abbrAddress(address){
    return new Promise(async function(resolve) {
        if (!address) {
            address = ethereum.selectedAddress;
        }
        if ( address in ens ) {
            console.log("ens found");
            resolve(ens[address]);
        } else {
            resolve( address.slice(0,4) + "..." + address.slice(address.length - 4) );
        }
    });
}

async function updateENS(address){
    return new Promise(async function(resolve) {
        if (!address) {
            address = ethereum.selectedAddress;
        }
        if ( address in ens ) {
            console.log("ens found");
            resolve(ens[address]);
        } else {
            console.log("ens not found");
            var name = await ensProvider.lookupAddress(address);
            if (name) {
                console.log(`ens["${address}"] = "${name}";`);
                ens[address] = name;
                resolve(name);
            } else {
                resolve( address.slice(0,4) + "..." + address.slice(address.length - 4) );
            }
        }
    });
}

const tokens = {};
tokens.BSCT = {
    "address": addr.BSCT,
    "symbol": "BSCT",
    "decimals": 18,
    "image": "https://degendogs.club/images/BSCT.png"
}
tokens.idleWETHx = {
    "address": addr.idleWETHx,
    "symbol": "idleWETHx",
    "decimals": 18,
    "image": "https://degendogs.club/images/idleWETH.svg"
}

async function addToken(symbol) {
    var token = tokens[symbol];
    const tokenAddress = token.address;
    const tokenSymbol = token.symbol;
    const tokenDecimals = token.decimals;
    var tokenImage = token.image;
    //console.log("tokenImage", tokenImage);

    try {
        // wasAdded is a boolean. Like any RPC method, an error may be thrown.
        const wasAdded = await ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20', // Initially only supports ERC20, but eventually more!
                options: {
                    address: tokenAddress, // The address that the token is at.
                    symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                    decimals: tokenDecimals, // The number of decimals in the token
                    image: tokenImage, // A string url of the token logo
                },
            },
        });

        if (wasAdded) {
            console.log('Thanks for your interest!');
        } else {
            console.log('Your loss!');
        }
    } catch (error) {
        console.log(error);
    }
    return false;
}

async function main() {
    dappChain = await web3.eth.getChainId();
    //console.log("The chainId is " + dappChain);

    accounts = await web3.eth.getAccounts();
    //connectWallet();
    if (accounts.length > 0) {
        $(".connect").html(`<span class="NavBar_greenStatusCircle__1zBA7"></span>` + await abbrAddress());
        $(".connected").show();
        if (!paused) {
            //$("#bid-button").prop("disabled", false);
        }
    }

    userChain = await ethereum.request({ method: 'eth_chainId' });
    //console.log("The chainId of connected account is " + web3.utils.hexToNumber(userChain));

    if ( !correctChain() ) {
        $("body").append(wrongNetworkModal());
        $(".close, .modal-backdrop").click(function(){
            $(".fade.show").remove();
        });
    }

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
        //console.log("window.ethereum true");
        window.ethereum
            .enable()
            .then(async result => {
                // Metamask is ready to go!
                //console.log(result);
                accounts = result;
                $(".connect").html(`<span class="NavBar_greenStatusCircle__1zBA7"></span>` + await abbrAddress());
                $(".connected").show();
                if (!paused) {
                    //$("#bid-button").prop("disabled", false);
                }
            })
            .catch(reason => {
                // Handle error. Likely the user rejected the login.
            });
    } else {
        // The user doesn't have Metamask installed.
        console.log("window.ethereum false");
    } 
} // connectWallet()

function fromWei(amount) {
    return web3.utils.fromWei(new BN(amount));
}

var flowTimer;
async function getFlows() {
    clearInterval(flowTimer);
    var dogBalanceIdleWETH = await idleWETH.methods.balanceOf(addr.dog).call();
    //console.log("dogBalanceIdleWETH", parseFloat(dogBalanceIdleWETH / 1e18));
    var dogBalanceIdleWETHx = await idleWETHx.methods.balanceOf(addr.dog).call();
    //console.log("dogBalanceIdleWETHx", parseFloat(dogBalanceIdleWETHx / 1e18));
    var treasuryBalanceIdleWETH = await idleWETH.methods.balanceOf(addr.treasury).call();
    //console.log("treasuryBalanceIdleWETH", treasuryBalanceIdleWETH);
    var treasuryBalanceIdleWETHx = await idleWETHx.methods.balanceOf(addr.treasury).call();
    //console.log("treasuryBalanceIdleWETHx", treasuryBalanceIdleWETHx);
    var vestorBalanceIdleWETHx = await idleWETHx.methods.balanceOf(addr.vestor).call();
    //console.log("vestorBalanceIdleWETHx", vestorBalanceIdleWETHx);
    var dogBalance = parseFloat(dogBalanceIdleWETH / 1e18) + 
        parseFloat(dogBalanceIdleWETHx / 1e18) +
        parseFloat(treasuryBalanceIdleWETH / 1e18) + 
        parseFloat(treasuryBalanceIdleWETHx / 1e18) +
        parseFloat(vestorBalanceIdleWETHx / 1e18);
    //console.log("dogBalance", dogBalance);
    var userBalance = await idleWETHx.methods.balanceOf(ethereum.selectedAddress).call();
    //console.log("userBalance", fromWei(userBalance));
    userBalance = parseFloat(fromWei(userBalance));
    var dogFlow = await cfa.methods.getNetFlow(addr.idleWETHx, addr.vestor).call();
    //console.log("dogFlow", fromWei(dogFlow));
    dogFlow = parseFloat(fromWei(dogFlow));
    var userFlow = await cfa.methods.getFlow(addr.idleWETHx, addr.vestor, ethereum.selectedAddress).call();
    //console.log("userFlow", userFlow);
    //console.log("userFlowRate", fromWei(userFlow.flowRate));
    userFlow = parseFloat(fromWei(userFlow.flowRate));
    var BSCTbal = await BSCT.methods.balanceOf(ethereum.selectedAddress).call();
    BSCTbal = parseFloat(fromWei(BSCTbal));

    $("#bsct").text(BSCTbal.toFixed(0));
    $("#treasury").text(dogBalance.toFixed(4));
    $("#account").text(userBalance.toFixed(4));
    flowTimer = setInterval(() => {
        dogBalance += dogFlow;
        $("#treasury").text(dogBalance.toFixed(4));
        userBalance += userFlow;
        $("#account").text(userBalance.toFixed(4));
    }, 1000);
}

var timer;
function countdown(a){
    const endTime = a.endTime;
    const currentTime = Date.now() / 1000;
    const diffTime = endTime - currentTime;
    let duration = moment.duration(diffTime * 1000, 'milliseconds');
    const interval = 1000;

    timer = setInterval(async () => {
        duration = moment.duration(duration - interval, 'milliseconds');
        var hours = duration.hours();
        if (duration.asSeconds() < 0) {
            // time's up
            clearInterval(timer);
            var a = await auction.methods.auction().call();
            var winner = await abbrAddress(a.bidder);
            $("#timer").html(`
                <h2>${winner}</h2>
            `
            ).prev("h4").text("Winner");
            $("#current-bid h4").text("Winning Bid");
            currentAuction();
        } else {
            if ( duration.days() > 0 ) {
                hours += duration.days() * 24;
            }
            $("#timer").html(`
                <div class="AuctionTimer_timerSection__2RlJK"><span>${hours}<span
                class="AuctionTimer_small__3FXgu">h</span></span></div>
                <div class="AuctionTimer_timerSection__2RlJK"><span>${duration.minutes()}<span
                    class="AuctionTimer_small__3FXgu">m</span></span></div>
                <div class="AuctionTimer_timerSection__2RlJK"><span>${duration.seconds()}<span
                    class="AuctionTimer_small__3FXgu">s</span></span></div>
                `
            );
        }
    }, interval);
}

async function getBids(a) {

    var logs = [];
    if (dappChain != 31337) {
        const covEventsUrl = "https://api.covalenthq.com/v1/" + dappChain + "/events/topics/0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3/?starting-block=25934902&ending-block=latest&sender-address=" + addr.auction + "&match=%7B%22raw_log_topics.1%22%3A%22" + dogIdTopic + "%22%7D&sort=%7B%22block_signed_at%22%3A%22-1%22%7D&key=ckey_ac7c55f53e19476b85f0a1099af";
        //console.log(covEventsUrl);
        const response = await fetch(covEventsUrl);
        var covEvents = await response.json();
        //console.log(covEvents);
        logs = covEvents.data.items;
    }
    for (let index = 0; index < logs.length; index++) {
        var log = logs[index];
        //console.log(log);
        var event = web3.eth.abi.decodeParameters(['address', 'uint256', 'bool'], log.raw_log_data);
        //console.log(event);
        var amt = parseFloat(web3.utils.fromWei( event[1] ));
        if (index == 0) {
            a.amount = event[1];
            a.bidder = event[0];
            if (!a.endTime) {
                a.endTime = moment(log.block_signed_at).format("X");
            }
            if (!a.startTime) {
                a.startTime = moment(log.block_signed_at).format("X") - 60*60;
            }
        }
        var bid = {
            "bidder": event[0],
            "bid": amt.toFixed(2),
            "txn": log.tx_hash,
            "date": log.block_signed_at
        };
        //console.log(bid);
        if (index < 3) {
            bidsHTML += await getBidRowHTML(bid);
            //console.log("bidsHTML",bidsHTML);
        }
        bidsHTMLAll += await getBidRowHTML(bid, true);
    }
}

async function currentAuction(thisDog) {
    paused = await auction.methods.paused().call();
    if (paused) {
        $("#bid-button").prop("disabled", true);
        return;
    }
    clearInterval(timer);
    if ( typeof thisDog === 'undefined' || thisDog == currentDogId ) {
        a = await auction.methods.auction().call();
        currentDogId = a.dogId;
    } else {
        a = {
            "dogId": thisDog,
            "startTime": null,
            "endTime": null,
            "amount": new BN('0000000000'),
            "bidder": "0x0000000000000000000000000000000000000000",
            "settled": true
        };
    } 
    var startingBlock = 26060775;
    startingBlock = 25818530; // auction creation block
    //console.log(a);
    const imageUrl = "https://api.degendogs.club/images/" + a.dogId + ".png";
    var tempImage = new Image();
    tempImage.src = imageUrl;
    $("#dog-image").attr("src", imageUrl).attr("alt", "Dog " + a.dogId + " is a member of the Degen Dogs Club");
    $("#dog-title").text("Dog " + a.dogId);
    var date = moment.utc(a.startTime, "X").format("MMMM D YYYY");
    $("#dog-date").text(date);
    var currentBid = parseFloat(web3.utils.fromWei(a.amount));
    $(".dog-current-bid").text("Ξ " + currentBid.toFixed(2));
    var minBid = web3.utils.fromWei(a.amount) * 1.1
    if ( minBid == 0 ) {
        // reserve price
        minBid = 0.05;
    }
    a.minBid = minBid.toFixed(2);
    $("#dog-min-bid").text(a.minBid);

    var dogIdTopic = web3.utils.padLeft(web3.utils.toHex(a.dogId), 64);
    //console.log(dogIdTopic);
    var bidsHTML = "";
    var bidsHTMLAll = "";

    // covalent was here
    
    a.bidsHTML = bidsHTML;
    a.bidsHTMLAll = bidsHTMLAll;
    const endTime = a.endTime;
    const currentTime = Date.now() / 1000;
    var diffTime = endTime - currentTime;
    //diffTime = 86400; // TODO: change this!!!!
    let duration = moment.duration(diffTime * 1000, 'milliseconds');
    a.duration = duration;
    var dogHTML = await getDogHTML(a);
    $("#dog").html(dogHTML);
    //console.log("duration", a.duration.asSeconds());
    if (a.duration.asSeconds() > 0) {
        countdown(a);
    }
    if (accounts.length > 0) {
        //$("#bid-button").prop("disabled", false);
    }
    if (ethereum.selectedAddress) {
        //$("#bid-button").prop("disabled", false);
        $("#settle-button").prop("disabled", false);
    }

    

    var allowance = await WETH.methods.allowance(ethereum.selectedAddress, addr.auction).call();
    console.log("allowance", allowance);
    if (parseInt(allowance) > 0) {
        approved = allowance / 1e18;
        $("#bid-button").text("Bid");
    }

    

    

    
    

    

    var logs = [];
    if (dappChain != 31337) {
        const covEventsUrl = "https://api.covalenthq.com/v1/" + dappChain + "/events/topics/0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3/?starting-block=" + startingBlock + "&ending-block=latest&sender-address=" + addr.auction + "&match=%7B%22raw_log_topics.1%22%3A%22" + dogIdTopic + "%22%7D&sort=%7B%22block_signed_at%22%3A%22-1%22%7D&key=ckey_ac7c55f53e19476b85f0a1099af&page-size=1000";
        //console.log(covEventsUrl);
        const response = await fetch(covEventsUrl);
        var covEvents = await response.json();
        //console.log(covEvents);
        logs = covEvents.data.items;
    }
    for (let index = 0; index < logs.length; index++) {
        var log = logs[index];
        //console.log(log);
        var event = web3.eth.abi.decodeParameters(['address', 'uint256', 'bool'], log.raw_log_data);
        //console.log(event);
        var amt = parseFloat(web3.utils.fromWei( event[1] ));
        if (index == 0) {
            a.amount = event[1];
            a.bidder = event[0];
            if (!a.endTime) {
                a.endTime = moment(log.block_signed_at).format("X");
            }
            if (!a.startTime) {
                a.startTime = moment(log.block_signed_at).format("X") - 60*60;
            }
        }
        var bid = {
            "bidder": event[0],
            "bid": amt.toFixed(2),
            "txn": log.tx_hash,
            "date": log.block_signed_at
        };
        //console.log(bid);
        if (index < 3) {
            bidsHTML += await getBidRowHTML(bid);
            //console.log("bidsHTML",bidsHTML);
        }
        bidsHTMLAll += await getBidRowHTML(bid, true);
    }
    a.bidsHTML = bidsHTML;
    a.bidsHTMLAll = bidsHTMLAll;
    dogHTML = await getDogHTML(a);
    $("#dog").html(dogHTML);
    if (ethereum.selectedAddress) {
        //$("#bid-button").prop("disabled", false);
        $("#settle-button").prop("disabled", false);
    }
    if (parseInt(allowance) > 0) {
        approved = allowance / 1e18;
        $("#bid-button").text("Bid");
    }
    $(".bid").find(".address").each(async function(){
        var address = $(this).data("address");
        var name = await updateENS(address);
        if (name) {
            $(this).text(name);
        }
    });

}
currentAuction();
getFlows();



$( document ).ready(function() {

    // TODO: remove this for launch !!!!!!!!!
    //$("#dog").remove();

    $(".connect").click(function(){
        connectWallet();
        return false;
    });
    $(".card-header").click(function(){
        $(this).next().toggleClass("show");
        if ( $(this).next().hasClass("show") ) {
            $(".card-header").not(this).next(".collapse.show").removeClass("show");
        }
    });
    $(".add-to-metamask").click(function(){
        var symbol = $(this).data("token");
        addToken(symbol);
        return false;
    });

    $( "#dog" ).on( "keydown", "#new-bid", async function() {
    //$("#new-bid").keydown(function(){
        var newBid = $(this).val();
        if ( newBid ) {
            $("#bid-button").prop("disabled", false);
        }
    });

    $( "#dog" ).on( "change", "#new-bid", async function() {
        var newBid = $(this).val();
        if ( newBid > approved ) {
            $("#bid-button").text("Approve");
        }
    });

    $( "#dog" ).on( "click", "#bid-button", async function() {
    //$("#bid-button").click(async function(){
        var newBid = $("#new-bid").val();
        if ( approved >= newBid ) {
            $("#bid-button").text("Bidding...");
            const nonce = await web3.eth.getTransactionCount(accounts[0], 'latest');

            //the transaction
            const tx = {
                'from': ethereum.selectedAddress,
                'to': addr.auction,
                //'gasPrice': gas,
                'nonce': "" + nonce,
                'data': auction.methods.createBid(a.dogId, web3.utils.toHex(web3.utils.toWei(newBid))).encodeABI()
            };
            //console.log(tx);

            const txHash = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx],
            });
            //console.log(txHash);
            var pendingTxHash = txHash;
            web3.eth.subscribe('newBlockHeaders', async (error, event) => {
                if (error) {
                    console.log("error", error);
                }
                const blockTxHashes = (await web3.eth.getBlock(event.hash)).transactions;

                if (blockTxHashes.includes(pendingTxHash)) {
                    web3.eth.clearSubscriptions();
                    //console.log("Bid received!");
                    $("#bid-button").text("Bid Received!");
                    //currentAuction();
                    var bid = {
                        "bid": parseFloat(newBid).toFixed(2),
                        "txn": txHash,
                        "bidder": ethereum.selectedAddress,
                        "date": Date.now()
                    };
                    var bidHTML = await getBidRowHTML(bid);
                    $("#bid-history").prepend(bidHTML);
                    $("#dog-current-bid").text("Ξ " + parseFloat(newBid).toFixed(2)); 
                    a.minBid = parseFloat(newBid) * 1.1;
                    $("#dog-min-bid").text(a.minBid.toFixed(2));
                    $("#bid-button").text("Approve");
                    approved = 0;
                    $("#new-bid").val("");
                    //setTimeout(currentAuction, 5000);
                    var subscription = web3.eth.subscribe('logs', {
                        address: addr.auction,
                        topics: ["0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3", dogIdTopic]
                    }, function(error, result){
                        if (!error)
                            console.log(result);
                    })
                    .on("connected", function(subscriptionId){
                        //console.log(subscriptionId);
                    })
                    .on("data", async function(log){
                        //console.log(log);
                        var event = web3.eth.abi.decodeParameters(['address', 'uint256', 'bool'], log.data);
                        //console.log(event);
                        var amt = parseFloat(web3.utils.fromWei( event[1] ));
                        var bid = {
                            "bidder": event[0],
                            "bid": amt.toFixed(2),
                            "txn": txHash,
                            "date": Date.now()
                        };
                        //console.log(bid);
                        bidsHTML += await getBidRowHTML(bid);
                        $("#bid-history").prepend(bidHTML);
                    })
                }
            });
        } else {
            // need Approval
            $("#bid-button").text("Approving...");
            const nonce = await web3.eth.getTransactionCount(accounts[0], 'latest');

            //the transaction
            const tx = {
                'from': ethereum.selectedAddress,
                'to': addr.WETH,
                //'gasPrice': gas,
                'nonce': "" + nonce,
                'data': WETH.methods.approve(addr.auction, web3.utils.toHex(web3.utils.toWei(newBid))).encodeABI()
            };
            //console.log(tx);

            const txHash = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx],
            });
            //console.log(txHash);
            let transactionReceipt = null
            while (transactionReceipt == null) { 
                transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
                await sleep(500)
            }
            //console.log("Bid received!");
            $("#bid-button").text("Bid");
            approved = newBid;
        }
    });

    $( "#dog" ).on( "click", "#settle-button", async function() {
    //$("#settle-button").click(async function(){
        const nonce = await web3.eth.getTransactionCount(accounts[0], 'latest');

        //the transaction
        const tx = {
            'from': ethereum.selectedAddress,
            'to': addr.auction,
            //'gasPrice': gas,
            'nonce': "" + nonce,
            'data': auction.methods.settleCurrentAndCreateNewAuction().encodeABI()
        };
        //console.log(tx);

        $("#status").text("Waiting for settle transaction...");

        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [tx],
        });
        //console.log(txHash);
        var pendingTxHash = txHash;
        web3.eth.subscribe('newBlockHeaders', async (error, event) => {
            if (error) {
                console.log("error", error);
            }
            const blockTxHashes = (await web3.eth.getBlock(event.hash)).transactions;

            if (blockTxHashes.includes(pendingTxHash)) {
                web3.eth.clearSubscriptions();
                //console.log("Settled!");
                currentAuction();
                getFlows();
            }
        });
    });

    $( "#dog" ).on( "click", ".bid-history", async function() {
    //$(".bid-history").click(function(){
        var html = getBidHistoryModal(a);
        $("body").append(html);
        $(".close, .modal-backdrop").click(function(){
            $(".fade.show").remove();
        });
    });

    $( "#dog" ).on( "click", "#next-dog", async function() {
    //$("#next-dog").click(function(){
        var currentID = parseInt(a.dogId);
        currentAuction(currentID + 1);
        return false;
    });

    $( "#dog" ).on( "click", "#prev-dog", async function() {
    //$("#prev-dog").click(function(){
        var currentID = parseInt(a.dogId);
        currentAuction(currentID - 1);
        return false;
    });

});

// HTML templates
async function getBidRowHTML(bid, modal) {
    var address = await abbrAddress(bid.bidder);
    var date = moment(bid.date).format("MMMM DD [at] HH:mm");
    var html = `
        <li class="BidHistory_bidRow__bc1Zf bid">
            <div class="BidHistory_bidItem__13g5O">
            <div class="BidHistory_leftSectionWrapper__2T29z">
                <div class="BidHistory_bidder__1hPgQ">
                <div data-address="${bid.bidder}" class="address">${address}</div>
                </div>
                <div class="BidHistory_bidDate__32l9k">${date}</div>
            </div>
            <div class="BidHistory_rightSectionWrapper__3oem5">
                <div class="BidHistory_bidAmount__7W-Hz">Ξ ${bid.bid}</div>
                <div class="BidHistory_linkSymbol__29ypX"><a
                    href="https://polygonscan.com/tx/${bid.txn}"
                    target="_blank" rel="noreferrer"><svg aria-hidden="true" focusable="false"
                    data-prefix="fas" data-icon="external-link-alt"
                    class="svg-inline--fa fa-external-link-alt fa-w-16 " role="img"
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path fill="currentColor"
                        d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z">
                    </path>
                    </svg></a></div>
            </div>
            </div>
        </li>
    `;
    if ( modal ) {
        html = `
        <li class="BidHistory_bidRow__31Sl2 bid">
                <div class="BidHistory_bidItem__2EgHh">
                    <div class="BidHistory_leftSectionWrapper__3gsSj">
                    <div class="BidHistory_bidder__1R14A">
                        <div data-address="${bid.bidder}" class="address">${address}</div>
                    </div>
                    <div class="BidHistory_bidDate__3dDvg">${date}</div>
                    </div>
                    <div class="BidHistory_rightSectionWrapper__3N0DM">
                    <div class="BidHistory_bidAmount__3yfv7">Ξ ${bid.bid}</div>
                    <div class="BidHistory_linkSymbol__2qaZG"><a
                        href="https://polygonscan.com/tx/${bid.txn}"
                        target="_blank" rel="noreferrer"><svg aria-hidden="true" focusable="false" data-prefix="fas"
                            data-icon="external-link-alt" class="svg-inline--fa fa-external-link-alt fa-w-16 " role="img"
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path fill="currentColor"
                            d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z">
                            </path>
                        </svg></a></div>
                    </div>
                </div>
                </li>
        `;
    }
    return Promise.resolve(html);
}

function bidFormHTML(a) {
    var html = "";
    const endTime = a.endTime;
    const currentTime = Date.now() / 1000;
    const diffTime = endTime - currentTime;
    var ended = false;
    if ( diffTime < 0 ) {
        ended = true;
    }
    if ( ended ) {
        if (a.settled) {
            html = "";
        } else {
            html = `
                <div class="input-group"><button id="settle-button" disabled="" type="button"
                class="Bid_bidBtnAuctionEnded__1zL5T btn btn-primary">Settle Auction</button></div>
            `;
        }
    } else {
        html = `
        <p class="Bid_minBidCopy__1WI1j">Minimum bid: <span id="dog-min-bid">${a.minBid}</span> WETH</p>
        <div class="input-group"><input id="new-bid" aria-label=""
            aria-describedby="basic-addon1" min="0" type="number" class="Bid_bidInput__39un5 form-control"
            value=""><span class="Bid_customPlaceholder__3KOvn">WETH</span><button id="bid-button" disabled="" type="button"
            class="Bid_bidBtn__2MzFj btn btn-primary">Approve</button></div>
        `;
    }
    return html;
}

async function getTimerHTML(a) {
    var html = `
    <div class="AuctionTimer_timerSection__2RlJK"><span>0<span
                            class="AuctionTimer_small__3FXgu">h</span></span></div>
                        <div class="AuctionTimer_timerSection__2RlJK"><span>0<span
                            class="AuctionTimer_small__3FXgu">m</span></span></div>
                        <div class="AuctionTimer_timerSection__2RlJK"><span>0<span
                            class="AuctionTimer_small__3FXgu">s</span></span></div>
    `;
    if (a.duration.asSeconds() < 0) {
        html = await abbrAddress(a.bidder);
    }
    return Promise.resolve(html);
}

async function getDogHTML(a) {
    a.date = moment.utc(a.startTime, "X").format("MMMM D YYYY");
    a.currentBid = parseFloat(web3.utils.fromWei(a.amount)).toFixed(2);
    a.formHTML = bidFormHTML(a);
    a.timerHTML = await getTimerHTML(a);
    var next = `disabled=""`;
    var prev = ""
    if ( a.settled ) {
        next = "";
    }
    if ( a.dogId == 0 ) {
        prev = `disabled=""`;
    }
    var timerHeading = "Ends in";
    var bidHeading = "Current Bid";
    if (a.duration.asSeconds() < 0) {
        timerHeading = "Winner";
        bidHeading = "Winning Bid";
    }
    const imageUrl = "https://api.degendogs.club/images/" + a.dogId + ".png";
    var tempImage = new Image();
    tempImage.src = imageUrl;
    var ukraine = "";
    if (a.dogId == 1) {
        ukraine = `<div class="AuctionActivity_activityRow__1xuKY row"><div class="AuctionActivity_fomoNounsLink__1DC-a col-lg-12"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="info-circle" class="svg-inline--fa fa-info-circle fa-w-16 " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"></path></svg><a href="https://docs.degendogs.club/basics/donation#special-auction-ukraine-dog" target="_blank" rel="noreferrer">100% of Dog#1 proceeds go to 🇺🇦 Ukraine Relief</a></div></div>`;
    }
    var html = `
        <div class="row">
            <div class="Auction_nounContentCol__1o5ER col-lg-6">
            <div class="Auction_nounWrapper__3JSNc"><img id="dog-image"
                src="${imageUrl}"
                alt="Dog ${a.dogId} is a member of the Degen Dogs Club" class="Noun_img__1GJxo img-fluid"></div>
            </div>
            <div class="Auction_auctionActivityCol__3U2jw col-lg-6">
            <div>
                <div class="AuctionActivity_informationRow__2BOSj">
                <div class="AuctionActivity_activityRow__1xuKY row">
                    <div class="col-lg-12">
                    <h4 id="dog-date">${a.date}</h4>
                    </div>
                    <div class="AuctionActivity_colAlignCenter__3SaC2 col-lg-12">
                    <h1 class="AuctionActivityNounTitle_nounTitle__3_LLC" id="dog-title">Dog ${a.dogId}</h1><button ${prev} id="prev-dog" 
                        class="AuctionNavigation_leftArrow__1NOSB">←</button><button
                        class="AuctionNavigation_rightArrow__33rdI" ${next} id="next-dog">→</button>
                    </div>
                </div>
                <div class="AuctionActivity_activityRow__1xuKY row">
                    <div class="AuctionActivity_currentBidCol__3vgXb col-lg-5">
                    <div id="current-bid" class="CurrentBid_section__2oRi6">
                        <h4>${bidHeading}</h4>
                        <h2 id="dog-current-bid">Ξ ${a.currentBid}</h2>
                    </div>
                    </div>
                    <div class="AuctionActivity_auctionTimerCol__2oKfX col-lg-5">
                    <h4 class="AuctionTimer_title__1TwqG">${timerHeading}</h4>
                    <h2 id="timer" class="AuctionTimer_timerWrapper__3c10Z">
                        ${a.timerHTML}
                    </h2>
                    </div>
                </div>
                ${ukraine}
                </div>
                <div class="AuctionActivity_activityRow__1xuKY row">
                <div class="col-lg-12">
                    ${a.formHTML}
                </div>
                </div>
                <div class="AuctionActivity_activityRow__1xuKY row">
                <div class="col-lg-12">
                    <ul id="bid-history" class="BidHistory_bidCollection__2FxcB">
                        ${a.bidsHTML}
                    </ul>
                    <div class="BidHistoryBtn_bidHistoryWrapper__3Zsy9">
                    <div class="BidHistoryBtn_bidHistory__2lmSd bid-history">Bid History →</div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
    `;
    return Promise.resolve(html);
}

function getBidHistoryModal(a) {
    var html = "";
    html = `
    <div class="fade modal-backdrop show"></div>
    <div role="dialog" aria-modal="true" class="fade modal show" tabindex="-1" style="display: block; padding-left: 0px;">
        <div class="modal-dialog modal-90w">
        <div class="modal-content">
            <div class="AuctionActivity_modalHeader__2pkxA modal-header">
            <div class="AuctionActivity_modalHeaderNounImgWrapper__3boIZ"><img
                src="https://api.degendogs.club/images/${a.dogId}.png"
                alt="Dog ${a.dogId} is a member of the Degen Dogs Club" class="Noun_img__1GJxo img-fluid"></div>
            <div class="AuctionActivity_modalTitleWrapper__2w2pt modal-title h4">
                <h1>Dog ${a.dogId}<br> Bid History</h1>
            </div><button type="button" class="close"><span aria-hidden="true">×</span><span
                class="sr-only">Close</span></button>
            </div>
            <div class="modal-body">
            <ul class="BidHistory_bidCollection__1DoXy">
                ${a.bidsHTMLAll}
            </ul>
            </div>
        </div>
        </div>
    </div>
    `;
    return html;
}

function wrongNetworkModal(){
    var html = "";
    html = `
    <div class="fade modal-backdrop show"></div>
    <div role="dialog" aria-modal="true" class="fade modal show" tabindex="-1" style="display: block;">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title h4">Wrong Network Detected</div>
                </div>
                <div class="modal-body">
                    <p>Degen Dogs Clubs is on the Polygon Network.</p>
                    <p><b>To get started, please switch your network by following the instructions below:</b></p>
                    <ol>
                        <li>Open Metamask</li>
                        <li>Click the network select dropdown</li>
                        <li>Click on "Matic Mainnet" or "Polygon"</li>
                    </ol>
                    <p><strong>Not seeing it?</strong> <a href="https://docs.degendogs.club/basics/auctions#getting-weth-on-polygon" target="_blank">Click here</a>.
                </div>
            </div>
        </div>
    </div>
    `;
    return html;
}
