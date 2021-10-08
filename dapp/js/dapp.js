var web3 = AlchemyWeb3.createAlchemyWeb3("wss://eth-kovan.alchemyapi.io/v2/n_mDCfTpJ8I959arPP7PwiOptjubLm57");
var BN = web3.utils.BN;

const cfaAddress = "0xECa8056809e7e8db04A8fF6e4E82cD889a46FE2F";
const cfa = new web3.eth.Contract(cfaABI, cfaAddress);
const dogAddress = "0x8B231C8323E448152605B35BEb8c2498731C5D30";
const dog = new web3.eth.Contract(dogABI, dogAddress);
const auctionAddress = "0x93c08fe426882B0A69F9D88b9c5Df17Ef8F4F92E";
const auction = new web3.eth.Contract(auctionABI, auctionAddress);
const cDAIAddress = "0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD";
const cDAI = new web3.eth.Contract(tokenABI, cDAIAddress);
const cDAIxAddress = "0x3ED99f859D586e043304ba80d8fAe201D4876D57";
const cDAIx = new web3.eth.Contract(tokenABI, cDAIxAddress);

var gas = web3.utils.toHex(new BN('2000000000')); // 2 Gwei;
var dappChain;
var userChain;
var accounts;
var a; // current auction or Dog

function abbrAddress(address){
    if (!address) {
        address = ethereum.selectedAddress;
    }
    return address.slice(0,4) + "..." + address.slice(address.length - 4);
}

async function main() {
    dappChain = await web3.eth.getChainId();
    //console.log("The chainId is " + dappChain);

    accounts = await web3.eth.getAccounts();
    //connectWallet();

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

function fromWei(amount) {
    return web3.utils.fromWei(new BN(amount));
}

var flowTimer;
async function getFlows() {
    clearInterval(flowTimer);
    var dogBalanceCDAI = await cDAI.methods.balanceOf(dogAddress).call();
    //console.log(dogBalanceCDAI / 1e8);
    var dogBalanceCDAIx = await cDAIx.methods.balanceOf(dogAddress).call();
    //console.log(fromWei(dogBalanceCDAIx));
    var dogBalance = parseFloat(dogBalanceCDAI / 1e8) + parseFloat(fromWei(dogBalanceCDAIx));
    //console.log(dogBalance);
    var userBalance = await cDAIx.methods.balanceOf(ethereum.selectedAddress).call();
    //console.log(fromWei(userBalance));
    userBalance = parseFloat(fromWei(userBalance));
    var dogFlow = await cfa.methods.getNetFlow("0x3ED99f859D586e043304ba80d8fAe201D4876D57", dogAddress).call();
    //console.log(fromWei(dogFlow));
    dogFlow = parseFloat(fromWei(dogFlow));
    var userFlow = await cfa.methods.getFlow("0x3ED99f859D586e043304ba80d8fAe201D4876D57", dogAddress, ethereum.selectedAddress).call();
    //console.log(userFlow);
    //console.log(fromWei(userFlow.flowRate));
    userFlow = parseFloat(fromWei(userFlow.flowRate));

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
        if (duration.asSeconds() < 0) {
            // time's up
            clearInterval(timer);
            var a = await auction.methods.auction().call();
            var winner = abbrAddress(a.bidder);
            $("#timer").html(`
                <h2>${winner}</h2>
            `
            ).prev("h4").text("Winner");
            $("#current-bid h4").text("Winning Bid");
            currentAuction();
        } else {
            $("#timer").html(`
                <div class="AuctionTimer_timerSection__2RlJK"><span>${duration.hours()}<span
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

async function currentAuction(thisDog) {
    clearInterval(timer);
    if ( typeof thisDog === 'undefined' ) {
        a = await auction.methods.auction().call();
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
    //console.log(a);
    $("#dog-image").attr("src", "/images/" + a.dogId + ".png").attr("alt", "Dog " + a.dogId + " is a member of the Degen Dogs Club");
    $("#dog-title").text("Dog " + a.dogId);
    var date = moment.utc(a.startTime, "X").format("MMMM D YYYY");
    $("#dog-date").text(date);
    var currentBid = parseFloat(web3.utils.fromWei(a.amount));
    $(".dog-current-bid").text("Ξ " + currentBid.toFixed(2));
    var minBid = web3.utils.fromWei(a.amount) * 1.1
    if ( minBid == 0 ) {
        // reserve price
        minBid = 0.1;
    }
    $("#dog-min-bid").text(minBid.toFixed(2));

    var dogIdTopic = web3.utils.padLeft(web3.utils.toHex(a.dogId), 64);
    //console.log(dogIdTopic);
    const covEventsUrl = "https://api.covalenthq.com/v1/42/events/topics/0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3/?starting-block=27539184&ending-block=latest&sender-address=" + auctionAddress + "&match=%7B%22raw_log_topics.1%22%3A%22" + dogIdTopic + "%22%7D&sort=%7B%22block_signed_at%22%3A%22-1%22%7D&key=ckey_ac7c55f53e19476b85f0a1099af";
    //console.log(covEventsUrl);
    const response = await fetch(covEventsUrl);
    var covEvents = await response.json();
    //console.log(covEvents);
    logs = covEvents.data.items;
    var bidsHTML = "";
    var bidsHTMLAll = "";
    $.each(logs, function(index, log) {
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
            bidsHTML += getBidRowHTML(bid);
        }
        bidsHTMLAll += getBidRowHTML(bid, true);
    });
    a.bidsHTML = bidsHTML;
    a.bidsHTMLAll = bidsHTMLAll;
    const endTime = a.endTime;
    const currentTime = Date.now() / 1000;
    const diffTime = endTime - currentTime;
    let duration = moment.duration(diffTime * 1000, 'milliseconds');
    a.duration = duration;
    var dogHTML = getDogHTML(a);
    $("#dog").html(dogHTML);
    if (a.duration.asSeconds() > 0) {
        countdown(a);
    }
    if (accounts.length > 0) {
        $("#bid-button").prop("disabled", false);
    }
    if (ethereum.selectedAddress) {
        $("#bid-button").prop("disabled", false);
        $("#settle-button").prop("disabled", false);
    }
    $("#bid-button").click(async function(){
        $("#bid-button").text("Bidding...");
        var newBid = $("#new-bid").val();
        const nonce = await web3.eth.getTransactionCount(accounts[0], 'latest');

        //the transaction
        const tx = {
            'from': ethereum.selectedAddress,
            'to': auctionAddress,
            'gasPrice': gas,
            'value': web3.utils.toHex(web3.utils.toWei(newBid)),
            'nonce': "" + nonce,
            'data': auction.methods.createBid(a.dogId).encodeABI()
        };
        //console.log(tx);

        $("#status").text("Waiting for follow transaction...");

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
                    "bidder": ethereum.selectedAddress,
                    "date": Date.now()
                };
                var bidHTML = getBidRowHTML(bid);
                $("#bid-history").prepend(bidHTML);
                $("#dog-current-bid").text("Ξ " + parseFloat(newBid).toFixed(2)); 
                $("#bid-button").text("Bid");
                //setTimeout(currentAuction, 5000);
                var subscription = web3.eth.subscribe('logs', {
                    address: auctionAddress,
                    topics: ["0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3", dogIdTopic]
                }, function(error, result){
                    if (!error)
                        console.log(result);
                })
                .on("connected", function(subscriptionId){
                    //console.log(subscriptionId);
                })
                .on("data", function(log){
                    //console.log(log);
                    var event = web3.eth.abi.decodeParameters(['address', 'uint256', 'bool'], log.data);
                    //console.log(event);
                    var amt = parseFloat(web3.utils.fromWei( event[1] ));
                    var bid = {
                        "bidder": event[0],
                        "bid": amt.toFixed(2),
                        "txn": log.transactionHash,
                        "date": Date.now()
                    };
                    //console.log(bid);
                    bidsHTML += getBidRowHTML(bid);
                    $("#bid-history").prepend(bidHTML);
                })
            }
        });
    });

    $("#settle-button").click(async function(){
        const nonce = await web3.eth.getTransactionCount(accounts[0], 'latest');

        //the transaction
        const tx = {
            'from': ethereum.selectedAddress,
            'to': auctionAddress,
            'gasPrice': gas,
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

    $(".bid-history").click(function(){
        var html = getBidHistoryModal(a);
        $("body").append(html);
        $(".close, .modal-backdrop").click(function(){
            $(".fade.show").remove();
        });
    });

    $("#next-dog").click(function(){
        var currentID = parseInt(a.dogId);
        currentAuction(currentID + 1);
        return false;
    });
    $("#prev-dog").click(function(){
        var currentID = parseInt(a.dogId);
        currentAuction(currentID - 1);
        return false;
    });

}
currentAuction();
getFlows();



$( document ).ready(function() {
    $(".card-header").click(function(){
        $(this).next().toggleClass("show");
        if ( $(this).next().hasClass("show") ) {
            $(".card-header").not(this).next(".collapse.show").removeClass("show");
        }
    });
    $("#dao-nav").click(function(){
        $("#dao").click();
        return true;
    });

});

// HTML templates
function getBidRowHTML(bid, modal) {
    var address = abbrAddress(bid.bidder);
    var date = moment(bid.date).format("MMMM DD [at] HH:mm");
    var html = `
        <li class="BidHistory_bidRow__bc1Zf">
            <div class="BidHistory_bidItem__13g5O">
            <div class="BidHistory_leftSectionWrapper__2T29z">
                <div class="BidHistory_bidder__1hPgQ">
                <div>${address}</div>
                </div>
                <div class="BidHistory_bidDate__32l9k">${date}</div>
            </div>
            <div class="BidHistory_rightSectionWrapper__3oem5">
                <div class="BidHistory_bidAmount__7W-Hz">Ξ ${bid.bid}</div>
                <div class="BidHistory_linkSymbol__29ypX"><a
                    href="https://kovan.etherscan.io/tx/${bid.txn}"
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
        <li class="BidHistory_bidRow__31Sl2">
                <div class="BidHistory_bidItem__2EgHh">
                    <div class="BidHistory_leftSectionWrapper__3gsSj">
                    <div class="BidHistory_bidder__1R14A">
                        <div>${address}</div>
                    </div>
                    <div class="BidHistory_bidDate__3dDvg">${date}</div>
                    </div>
                    <div class="BidHistory_rightSectionWrapper__3N0DM">
                    <div class="BidHistory_bidAmount__3yfv7">Ξ ${bid.bid}</div>
                    <div class="BidHistory_linkSymbol__2qaZG"><a
                        href="https://kovan.etherscan.io/tx/${bid.txn}"
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
    return html;
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
        <p class="Bid_minBidCopy__1WI1j">Minimum bid: <span id="dog-min-bid">${a.minBid}</span> ETH</p>
        <div class="input-group"><input id="new-bid" aria-label=""
            aria-describedby="basic-addon1" min="0" type="number" class="Bid_bidInput__39un5 form-control"
            value=""><span class="Bid_customPlaceholder__3KOvn">ETH</span><button id="bid-button" disabled="" type="button"
            class="Bid_bidBtn__2MzFj btn btn-primary">Bid</button></div>
        `;
    }
    return html;
}

function getTimerHTML(a) {
    var html = `
    <div class="AuctionTimer_timerSection__2RlJK"><span>0<span
                            class="AuctionTimer_small__3FXgu">h</span></span></div>
                        <div class="AuctionTimer_timerSection__2RlJK"><span>0<span
                            class="AuctionTimer_small__3FXgu">m</span></span></div>
                        <div class="AuctionTimer_timerSection__2RlJK"><span>0<span
                            class="AuctionTimer_small__3FXgu">s</span></span></div>
    `;
    if (a.duration.asSeconds() < 0) {
        html = abbrAddress(a.bidder);
    }
    return html;
}

function getDogHTML(a) {
    a.date = moment.utc(a.startTime, "X").format("MMMM D YYYY");
    a.currentBid = parseFloat(web3.utils.fromWei(a.amount)).toFixed(2);
    a.minBid = parseFloat(web3.utils.fromWei(a.amount) * 1.1).toFixed(2);
    a.formHTML = bidFormHTML(a);
    a.timerHTML = getTimerHTML(a);
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
    var html = `
        <div class="row">
            <div class="Auction_nounContentCol__1o5ER col-lg-6">
            <div class="Auction_nounWrapper__3JSNc"><img id="dog-image"
                src="/images/${a.dogId}.png"
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
                        <h2 class="dog-current-bid">Ξ ${a.currentBid}</h2>
                    </div>
                    </div>
                    <div class="AuctionActivity_auctionTimerCol__2oKfX col-lg-5">
                    <h4 class="AuctionTimer_title__1TwqG">${timerHeading}</h4>
                    <h2 id="timer" class="AuctionTimer_timerWrapper__3c10Z">
                        ${a.timerHTML}
                    </h2>
                    </div>
                </div>
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
    return html;
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
                src="/images/${a.dogId}.png"
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
                    <p>Degen Dogs Clubs is currently on the Kovan Test Network. Mainnet launch coming soon.</p>
                    <p><b>To get started, please switch your network by following the instructions below:</b></p>
                    <ol>
                        <li>Open Metamask</li>
                        <li>Click the network select dropdown</li>
                        <li>Click on "Kovan Test Network"</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>
    `;
    return html;
}

var os = [
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847046526097424385",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847047625609052161",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847048725120679937",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847049824632307713",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847050924143935489",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847052023655563265",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847053123167191041",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847054222678818817",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847055322190446593",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847056421702074369",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847057521213702145",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847058620725329921",
    "https://testnets.opensea.io/assets/0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656/42398452190972679717300800056945679336581597704135043767047847059720236957697"
];