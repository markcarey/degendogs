pragma solidity ^0.8.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC721 } from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

interface AuctionHouse {
    struct Auction {
        uint256 dogId;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        address payable bidder;
        bool settled;
    }
    function auction() external view returns(Auction memory);
    function minBidIncrementPercentage() external view returns(uint8);
    function reservePrice() external view returns(uint256);
    function createBid(uint256 dogId, uint256 amount) external payable;
}

contract AuctionBidder is Ownable, ERC1155Holder, IERC721Receiver {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public treasury;
    IERC20 public weth;
    IERC721 public dogs;
    AuctionHouse public auctionHouse;

    uint256 public minBid;
    uint256 public maxBid;

    event MinBidUpdated(
        uint256 oldMinBid,
        uint256 newMinBid
    );
    event MaxBidUpdated(
        uint256 oldMaxBid,
        uint256 newMaxBid
    );

    constructor(address _auctionHouse, address _treasury, address _weth, address _dogs) {
        auctionHouse = AuctionHouse(_auctionHouse);
        weth = IERC20(_weth); 
        dogs = IERC721(_dogs);
        treasury = _treasury;

        // @dev max approve auctionHouse && treasury
        weth.approve(address(_auctionHouse), 2**256 - 1);
        weth.approve(address(_treasury), 2**256 - 1);

        transferOwnership(treasury);
    }

    function _balance() internal view returns(uint256) {
        return weth.balanceOf(address(this));
    }

    function setMinBid(uint256 _minBid) external onlyOwner {
        emit MinBidUpdated(minBid, _minBid);
        minBid = _minBid;
    }
    function setMaxBid(uint256 _maxBid) external onlyOwner {
        emit MaxBidUpdated(maxBid, _maxBid);
        maxBid = _maxBid;
    }

    function bidReady() view external returns(bool ready) {
        AuctionHouse.Auction memory auction = auctionHouse.auction();
        if ( 
            ( block.timestamp < auction.endTime ) && 
            ( maxBid >= auction.amount + (( auction.amount * auctionHouse.minBidIncrementPercentage() ) / 100) ) &&
            ( _balance() >= auction.amount + (( auction.amount * auctionHouse.minBidIncrementPercentage() ) / 100) ) &&
            ( auction.bidder != address(this) ) &&
            ( _balance() >= minBid )
        ) {
            ready = true;
        }
    }

    // @dev this function can be used as trigger on Gelato network
    function bidReadyGelato() external view returns(bool canExec, bytes memory execPayload) {
        canExec = this.bidReady();
        if (canExec == true) {
            execPayload = abi.encodeWithSelector(this.bid.selector);
        }
    }

    function bid() external {
        require(this.bidReady() == true, "can't bid");
        AuctionHouse.Auction memory auction = auctionHouse.auction();
        // @dev bid the minimum
        uint256 amount = auction.amount + (( auction.amount * auctionHouse.minBidIncrementPercentage() ) / 100);
        if (amount == 0) {
            amount = auctionHouse.reservePrice();
        }
        if (minBid > amount) {
            amount = minBid;
        }
        auctionHouse.createBid(auction.dogId, amount);
    }

    // @dev send won Dogs to tresury
    function transferDog(uint256 dogId) external {
        dogs.transferFrom(address(this), treasury, dogId);
    }

    // @dev for BSCT,idleWETHx, etc
    function transferERC20(address token) external {
        require(token != address(weth), "use transferWETH function");
        uint256 amount = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(treasury, amount);
    }

    // @dev for WETH
    function transferWETH() external onlyOwner {
        uint256 amount = weth.balanceOf(address(this));
        weth.safeTransfer(treasury, amount);
    }

    function onERC721Received(
        address operator, 
        address from, 
        uint256 tokenId, 
        bytes calldata data) external pure override returns (bytes4) 
    {
        return IERC721Receiver.onERC721Received.selector;
    }

}
