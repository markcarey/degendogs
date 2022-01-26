// SPDX-License-Identifier: GPL-3.0

/// @title Interface for Degen Dogs Auction Houses


pragma solidity ^0.8.0;

interface IDogsAuctionHouse {
    struct Auction {
        // ID for the Dog (ERC721 token ID)
        uint256 dogId;
        // The current highest bid amount
        uint256 amount;
        // The time that the auction started
        uint256 startTime;
        // The time that the auction is scheduled to end
        uint256 endTime;
        // The address of the current highest bid
        address payable bidder;
        // Whether or not the auction has been settled
        bool settled;
    }

    event AuctionCreated(uint256 indexed dogId, uint256 startTime, uint256 endTime);

    event AuctionBid(uint256 indexed dogId, address sender, uint256 value, bool extended);

    event AuctionExtended(uint256 indexed dogId, uint256 endTime);

    event AuctionSettled(uint256 indexed dogId, address winner, uint256 amount);

    event AuctionTimeBufferUpdated(uint256 timeBuffer);

    event AuctionDurationUpdated(uint256 duration);

    event AuctionReservePriceUpdated(uint256 reservePrice);

    event AuctionMinBidIncrementPercentageUpdated(uint256 minBidIncrementPercentage);

    function settleAuction() external;

    function settleCurrentAndCreateNewAuction() external;

    function createBid(uint256 dogId, uint256 amount) external payable;

    function pause() external;

    function unpause() external;

    function setTimeBuffer(uint256 timeBuffer) external;

    function setDuration(uint256 duration) external;

    function setReservePrice(uint256 reservePrice) external;

    function setMinBidIncrementPercentage(uint8 minBidIncrementPercentage) external;
}
