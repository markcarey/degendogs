// SPDX-License-Identifier: GPL-3.0

/// @title The Degen Dogs auction house


// LICENSE
//
// DogsAuctionHouse.sol is a modified version of Nounders DAO's NounsAuctionHouse.sol:
// https://github.com/nounsDAO/nouns-monorepo/blob/8f614378f93c1f6fec35a254eb424f70e84925dd/packages/nouns-contracts/contracts/NounsAuctionHouse.sol
//
// NounsAuctionHouse.sol is a modified version of Zora's AuctionHouse.sol:
// https://github.com/ourzora/auction-house/blob/54a12ec1a6cf562e49f0a4917990474b11350a2d/contracts/AuctionHouse.sol
//
// AuctionHouse.sol source code Copyright Zora licensed under the GPL-3.0 license.
// With modifications by Nounders DAO and Degen Dogs Club.

pragma solidity ^0.8.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { PausableUpgradeable } from '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import { ReentrancyGuardUpgradeable } from '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import { OwnableUpgradeable } from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IDogsAuctionHouse } from './interfaces/IDogsAuctionHouse.sol';
import { IDogsToken } from './interfaces/IDogsToken.sol';
import { IWETH } from './interfaces/IWETH.sol';
import { BidTokens } from './BidTokens.sol';

contract DogsAuctionHouse is IDogsAuctionHouse, PausableUpgradeable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // The Degen Dogs ERC721 token contract
    IDogsToken public dogs;

    // The address of the WETH contract
    address public weth;

    // The minimum amount of time left in an auction after a new bid is created
    uint256 public timeBuffer;

    // The minimum price accepted in an auction
    uint256 public reservePrice;

    // The minimum percentage difference between the last bid amount and the current bid
    uint8 public minBidIncrementPercentage;

    // The duration of a single auction
    uint256 public duration;

    // The voting rewards token
    BidTokens public bidToken;

    // The active auction
    IDogsAuctionHouse.Auction public auction;

    /**
     * @notice Initialize the auction house and base contracts,
     * populate configuration values, and pause the contract.
     * @dev This function can only be called once.
     */
    function initialize(
        IDogsToken _dogs,
        address _weth,
        uint256 _timeBuffer,
        uint256 _reservePrice,
        uint8 _minBidIncrementPercentage,
        uint256 _duration,
        string calldata bidTokenName,
        string calldata bidTokenSymbol
    ) external initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();

        _pause();

        dogs = _dogs;
        weth = _weth;
        timeBuffer = _timeBuffer;
        reservePrice = _reservePrice;
        minBidIncrementPercentage = _minBidIncrementPercentage;
        duration = _duration;
        bidToken = new BidTokens(bidTokenName, bidTokenSymbol);

        IERC20 token = IERC20(weth);
        token.approve(address(dogs), 2**256 - 1);
    }

    /**
     * @notice Settle the current auction, mint a new Dog, and put it up for auction.
     */
    function settleCurrentAndCreateNewAuction() external override nonReentrant whenNotPaused {
        _settleAuction();
        _createAuction();
    }

    /**
     * @notice Settle the current auction.
     * @dev This function can only be called when the contract is paused.
     */
    function settleAuction() external override whenPaused nonReentrant {
        _settleAuction();
    }

    /**
     * @notice Create a bid for a Dog, with a given amount.
     * @dev This contract only accepts payment in ETH.
     */
    function createBid(uint256 dogId, uint256 amount) external payable override nonReentrant {
        IDogsAuctionHouse.Auction memory _auction = auction;

        require(_auction.dogId == dogId, 'Dog not up for auction');
        require(block.timestamp < _auction.endTime, 'Auction expired');
        require(amount >= reservePrice, 'Must send at least reservePrice');
        require(
            amount >= _auction.amount + ((_auction.amount * minBidIncrementPercentage) / 100),
            'Must send more than last bid by minBidIncrementPercentage amount'
        );

        _handleIncomingBid(amount, weth);

        address payable lastBidder = _auction.bidder;

        // Refund the last bidder, if applicable
        if (lastBidder != address(0)) {
            //_safeTransferETHWithFallback(lastBidder, _auction.amount);
            _handleOutgoingBid(lastBidder, _auction.amount, weth);
        }

        auction.amount = amount;
        auction.bidder = payable(msg.sender);

        if (msg.sender != lastBidder) {
            bidToken.mint(msg.sender, amount.mul(1000));
        }

        // Extend the auction if the bid was received within `timeBuffer` of the auction end time
        bool extended = _auction.endTime - block.timestamp < timeBuffer;
        if (extended) {
            auction.endTime = _auction.endTime = block.timestamp + timeBuffer;
        }

        emit AuctionBid(_auction.dogId, msg.sender, amount, extended);

        if (extended) {
            emit AuctionExtended(_auction.dogId, _auction.endTime);
        }
    }

    /**
     * @notice Pause the Dogs auction house.
     * @dev This function can only be called by the owner when the
     * contract is unpaused. While no new auctions can be started when paused,
     * anyone can settle an ongoing auction.
     */
    function pause() external override onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the Dogs auction house.
     * @dev This function can only be called by the owner when the
     * contract is paused. If required, this function will start a new auction.
     */
    function unpause() external override onlyOwner {
        _unpause();

        if (auction.startTime == 0 || auction.settled) {
            _createAuction();
        }
    }

    /**
     * @notice Set the auction time buffer.
     * @dev Only callable by the owner.
     */
    function setTimeBuffer(uint256 _timeBuffer) external override onlyOwner {
        timeBuffer = _timeBuffer;

        emit AuctionTimeBufferUpdated(_timeBuffer);
    }

    /**
     * @notice Set the auction duration.
     * @dev Only callable by the owner.
     */
    function setDuration(uint256 _duration) external override onlyOwner {
        duration = _duration;

        emit AuctionDurationUpdated(_duration);
    }

    /**
     * @notice Set the auction reserve price.
     * @dev Only callable by the owner.
     */
    function setReservePrice(uint256 _reservePrice) external override onlyOwner {
        reservePrice = _reservePrice;

        emit AuctionReservePriceUpdated(_reservePrice);
    }

    /**
     * @notice Set the auction minimum bid increment percentage.
     * @dev Only callable by the owner.
     */
    function setMinBidIncrementPercentage(uint8 _minBidIncrementPercentage) external override onlyOwner {
        minBidIncrementPercentage = _minBidIncrementPercentage;

        emit AuctionMinBidIncrementPercentageUpdated(_minBidIncrementPercentage);
    }

    /**
     * @notice Get the auction duration for {id}
     * @dev Checks hardcoded early cadence schedule and then defaults to {duration} after that
     */
    function _getDuration(uint256 id) internal view returns(uint256) {
        if ( id > 50 ) {
            return duration;
        } else if ( id > 46 ) {
            // 12 hours
            return 60*60*12;
        } else if ( id > 39 ) {
            // 8 hours
            return 60*60*8;
        } else if ( id > 26 ) {
            // 4 hours
            return 60*60*4;
        } else if ( id == 1 ) {
            // 72 hours - Ukraine Dog
            return 60*60*24*3;
        } else {
            // 2 hours up to id 26
            return 60*60*2;
        }
    }

    /**
     * @notice Create an auction.
     * @dev Store the auction details in the `auction` state variable and emit an AuctionCreated event.
     * If the mint reverts, the minter was updated without pausing this contract first. To remedy this,
     * catch the revert and pause this contract.
     */
    function _createAuction() internal {
        try dogs.mint() returns (uint256 dogId) {
            uint256 startTime = block.timestamp;
            uint256 endTime = startTime + _getDuration(dogId);

            auction = Auction({
                dogId: dogId,
                amount: 0,
                startTime: startTime,
                endTime: endTime,
                bidder: payable(0),
                settled: false
            });

            emit AuctionCreated(dogId, startTime, endTime);
        } catch Error(string memory) {
            _pause();
        }
    }

    /**
     * @notice Settle an auction, finalizing the bid and paying out to the owner.
     * @dev If there are no bids, the Dog is burned.
     */
    function _settleAuction() internal {
        IDogsAuctionHouse.Auction memory _auction = auction;

        require(_auction.startTime != 0, "Auction hasn't begun");
        require(!_auction.settled, 'Auction has already been settled');
        require(block.timestamp >= _auction.endTime, "Auction hasn't completed");

        auction.settled = true;
        dogs.issue(_auction.bidder, _auction.dogId, _auction.amount);
        bidToken.mint(msg.sender, _auction.amount.mul(1000));

        emit AuctionSettled(_auction.dogId, _auction.bidder, _auction.amount);
    }

    /**
     * @dev Given an amount and a currency, transfer the currency to this contract.
     * If the currency is ETH (0x0), attempt to wrap the amount as WETH
     */
    function _handleIncomingBid(uint256 amount, address currency) internal {
        // If this is an ETH bid, ensure they sent enough and convert it to WETH under the hood
        if(currency == address(0)) {
            require(msg.value == amount, "Sent ETH Value does not match specified bid amount");
            IWETH(weth).deposit{value: amount}();
        } else {
            // We must check the balance that was actually transferred to the auction,
            // as some tokens impose a transfer fee and would not actually transfer the
            // full amount to the market, resulting in potentally locked funds
            IERC20 token = IERC20(currency);
            uint256 beforeBalance = token.balanceOf(address(this));
            token.safeTransferFrom(msg.sender, address(this), amount);
            uint256 afterBalance = token.balanceOf(address(this));
            require(beforeBalance.add(amount) == afterBalance, "Token transfer call did not transfer expected amount");
        }
    }

    function _handleOutgoingBid(address to, uint256 amount, address currency) internal {
        // If the auction is in ETH, unwrap it from its underlying WETH and try to send it to the recipient.
        if(currency == address(0)) {
            IWETH(weth).withdraw(amount);

            // If the ETH transfer fails (sigh), rewrap the ETH and try send it as WETH.
            if(!_safeTransferETH(to, amount)) {
                IWETH(weth).deposit{value: amount}();
                IERC20(weth).safeTransfer(to, amount);
            }
        } else {
            IERC20(currency).safeTransfer(to, amount);
        }
    }

    /**
     * @notice Transfer ETH. If the ETH transfer fails, wrap the ETH and try send it as WETH.
     */
    function _safeTransferETHWithFallback(address to, uint256 amount) internal {
        if (!_safeTransferETH(to, amount)) {
            IWETH(weth).deposit{ value: amount }();
            IERC20(weth).transfer(to, amount);
        }
    }

    /**
     * @notice Transfer ETH and return the success status.
     * @dev This function only forwards 30,000 gas to the callee.
     */
    function _safeTransferETH(address to, uint256 value) internal returns (bool) {
        (bool success, ) = to.call{ value: value, gas: 30_000 }(new bytes(0));
        return success;
    }
}
