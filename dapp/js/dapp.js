var web3 = AlchemyWeb3.createAlchemyWeb3("wss://eth-kovan.alchemyapi.io/v2/n_mDCfTpJ8I959arPP7PwiOptjubLm57");
var BN = web3.utils.BN;

function abbrAddress(address){
    if (!address) {
        address = ethereum.selectedAddress;
    }
    //return "0x..." + address.slice(address.length - 6);
    return address.slice(0,4) + "..." + address.slice(address.length - 4);
}

const cfaAddress = "0xECa8056809e7e8db04A8fF6e4E82cD889a46FE2F";
const cfa = new web3.eth.Contract(cfaABI, cfaAddress);
const dogAddress = "0x1cA5d36c24B0a31e023Ff0bD8d5b627696d87Cd0";
const dog = new web3.eth.Contract(dogABI, dogAddress);
const auctionAddress = "0x0284541c2C6461213b092808CAAA700344CaE7e0";
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
    
}

function countdown(a){
    const endTime = a.endTime;
    const currentTime = Date.now() / 1000;
    const diffTime = endTime - currentTime;
    let duration = moment.duration(diffTime * 1000, 'milliseconds');
    const interval = 1000;

    var timer = setInterval(async () => {
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

    //auctionEvents(a.dogId);
    var dogIdTopic = web3.utils.padLeft(web3.utils.toHex(a.dogId), 64);
    console.log(dogIdTopic);
    const covEventsUrl = "https://api.covalenthq.com/v1/42/events/topics/0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3/?starting-block=27539184&ending-block=latest&sender-address=" + auctionAddress + "&match=%7B%22raw_log_topics.1%22%3A%22" + dogIdTopic + "%22%7D&sort=%7B%22block_signed_at%22%3A%22-1%22%7D&key=ckey_ac7c55f53e19476b85f0a1099af";
    console.log(covEventsUrl);
    const response = await fetch(covEventsUrl);
    var covEvents = await response.json();
    console.log(covEvents);
    //console.log(web3.utils.toHex(dogId));
    //var logs = await web3.eth.getPastLogs({
    //    address: auctionAddress,
    //    topics: ["0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3", dogIdTopic],
    //    fromBlock: 27539184
    //});
    logs = covEvents.data.items;
    var bidsHTML = "";
    $.each(logs, function(index, log) {
        console.log(log);
        var event = web3.eth.abi.decodeParameters(['address', 'uint256', 'bool'], log.raw_log_data);
        console.log(event);
        var amt = parseFloat(web3.utils.fromWei( event[1] ));
        var bid = {
            "bidder": event[0],
            "bid": amt.toFixed(2),
            "txn": log.tx_hash,
            "date": log.block_signed_at
        };
        console.log(bid);
        bidsHTML += getBidRowHTML(bid)
    });
    console.log(bidsHTML);
    a.bidsHTML = bidsHTML;
    var dogHTML = getDogHTML(a);
    $("#dog").html(dogHTML);
    countdown(a);
    if (accounts.length > 0) {
        $("#bid-button").prop("disabled", false);
    }
    if (ethereum.selectedAddress) {
        $("#bid-button").prop("disabled", false);
        $("#settle-button").prop("disabled", false);
    }
    $("#bid-button").click(async function(){
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
        console.log(tx);

        $("#status").text("Waiting for follow transaction...");

        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [tx],
        });
        console.log(txHash);
        var pendingTxHash = txHash;
        web3.eth.subscribe('newBlockHeaders', async (error, event) => {
            if (error) {
                console.log("error", error);
            }
            const blockTxHashes = (await web3.eth.getBlock(event.hash)).transactions;

            if (blockTxHashes.includes(pendingTxHash)) {
                web3.eth.clearSubscriptions();
                console.log("Bid received!");
                currentAuction();
                var bid = {
                    "bid": newBid.toFixed(2),
                    "bidder": ethereum.selectedAddress,
                    "date": Date.now()
                };
                var bidHTML = getBidRowHTML(bid);
                $("#bid-history").prepend(bidHTML);
                $("#dog-current-bid").text("Ξ " + newBid.toFixed(2)); 
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
        console.log(tx);

        $("#status").text("Waiting for settle transaction...");

        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [tx],
        });
        console.log(txHash);
        var pendingTxHash = txHash;
        web3.eth.subscribe('newBlockHeaders', async (error, event) => {
            if (error) {
                console.log("error", error);
            }
            const blockTxHashes = (await web3.eth.getBlock(event.hash)).transactions;

            if (blockTxHashes.includes(pendingTxHash)) {
                web3.eth.clearSubscriptions();
                console.log("Settled!");
                currentAuction();
            }
        });
    });

}
currentAuction();








// HTML templates
function getBidRowHTML(bid) {
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

function getDogHTML(a) {
    a.date = moment.utc(a.startTime, "X").format("MMMM D YYYY");
    a.currentBid = parseFloat(web3.utils.fromWei(a.amount)).toFixed(2);
    a.minBid = parseFloat(web3.utils.fromWei(a.amount) * 1.1).toFixed(2);
    a.formHTML = bidFormHTML(a);
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
                    <h1 class="AuctionActivityNounTitle_nounTitle__3_LLC" id="dog-title">Dog ${a.dogId}</h1><button
                        class="AuctionNavigation_leftArrow__1NOSB">←</button><button
                        class="AuctionNavigation_rightArrow__33rdI" disabled="">→</button>
                    </div>
                </div>
                <div class="AuctionActivity_activityRow__1xuKY row">
                    <div class="AuctionActivity_currentBidCol__3vgXb col-lg-5">
                    <div id="current-bid" class="CurrentBid_section__2oRi6">
                        <h4>Current bid</h4>
                        <h2 class="dog-current-bid">Ξ ${a.currentBid}</h2>
                    </div>
                    </div>
                    <div class="AuctionActivity_auctionTimerCol__2oKfX col-lg-5">
                    <h4 class="AuctionTimer_title__1TwqG">Ends in</h4>
                    <h2 id="timer" class="AuctionTimer_timerWrapper__3c10Z">
                        <div class="AuctionTimer_timerSection__2RlJK"><span>17<span
                            class="AuctionTimer_small__3FXgu">h</span></span></div>
                        <div class="AuctionTimer_timerSection__2RlJK"><span>39<span
                            class="AuctionTimer_small__3FXgu">m</span></span></div>
                        <div class="AuctionTimer_timerSection__2RlJK"><span>32<span
                            class="AuctionTimer_small__3FXgu">s</span></span></div>
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
                    <div class="BidHistoryBtn_bidHistory__2lmSd">Bid History →</div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
    `;
    return html;
}

