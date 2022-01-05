// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

//import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721 } from './base/ERC721.sol';
import './base/ERC721Enumerable.sol';
import { ERC721Checkpointable } from './base/ERC721Checkpointable.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
//import {ILendingPool} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

interface IUniswapRouter is ISwapRouter {
    function refundETH() external payable;
}

interface Erc20 {
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external returns (uint256);
    function decimals() external returns (uint8);
}


interface CErc20 {
    function mint(uint256) external returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function supplyRatePerBlock() external returns (uint256);
    function redeem(uint) external returns (uint);
    function redeemUnderlying(uint) external returns (uint);
    function approve(address, uint256) external returns (bool);
    function balanceOf(address) external returns (uint256);
    function decimals() external returns (uint8);
}

interface ICompoundComptroller {
    function claimComp(address holder) external;
}

interface ILendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
    function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external returns (uint256);
}

interface ITokenVestor {
    function deposit(IERC20 token, uint256 amount) external;
    function withdraw(IERC20 token, uint256 amount) external;
    function flowTokenBalance() external returns (uint256);
    function getNetFlow() external returns (int96);
    function registerFlow(address adr, int96 flowRate, bool isPermanent, uint256 cliffEnd, uint256 vestingDuration, uint256 cliffAmount, bytes32 ref) external;
    function registerBatch(address[] calldata adr, int96[] calldata flowRate, uint256[] calldata cliffEnd, uint256[] calldata vestingDuration, uint256[] calldata cliffAmount, bytes32[] calldata ref) external;
    function redirectStreams(address oldRecipient, address newRecipient, bytes32 ref) external;
}

interface IIdleToken {
    function token() external view returns (address underlying);
    function mintIdleToken(uint256 _amount, bool _skipWholeRebalance, address _referral) external returns (uint256 mintedTokens);
    function redeemIdleToken(uint256 _amount) external returns (uint256 redeemedTokens);
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external returns (uint256);
    function decimals() external returns (uint8);
}

contract Dog is ERC721, ERC721Checkpointable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    AggregatorV3Interface internal priceFeed;

    // Streamonomics:
    struct Streamonomics {
        uint256 percentagetoCurrent;
        uint256 percentagetoDogsBefore;
        uint256 dogsBefore;
        uint256 percentageShared;
        uint256 dogsShared;
    }
    Streamonomics public streamSettings; 

    // Kovan Contracts
    //IUniswapRouter public constant uniswapRouter = IUniswapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    //address private constant WETH9 = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
    //address private constant DAI = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;
    //address private constant cDAI = 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD;
    //address private constant cDAIx = 0x3ED99f859D586e043304ba80d8fAe201D4876D57;
    //address private constant comptroller = 0x5eAe89DC1C671724A672ff0630122ee834098657;

    // Mumbai Contracts
    IUniswapRouter public constant uniswapRouter = IUniswapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564); // 

    //address private constant WETH9 = 0x3C68CE8504087f89c640D02d133646d98e64ddd9; // mumbai
    

    address private constant DAI = 0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F;
    address private constant aaveLendingPool = 0x9198F13B08E299d85E096929fA9781A1E3d5d827;
    address private constant amWETH = 0x7aE20397Ca327721F013BB9e140C707F82871b56;
    address private constant amWETHx = 0x67A87A1daa04Da7aADA1787c1FaFd178553d9FE1;

    address private constant cDAI = 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD;
    address private constant cDAIx = 0x3ED99f859D586e043304ba80d8fAe201D4876D57;
    address private constant comptroller = 0x5eAe89DC1C671724A672ff0630122ee834098657;

    // Polygon:
    address private constant idleWETH = 0xfdA25D931258Df948ffecb66b5518299Df6527C4;
    address private constant idleWETHx = 0xEB5748f9798B11aF79F892F344F585E3a88aA784;
    address private constant WETH9 = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619; // polygon

    ITokenVestor private vestor; // Token Vesting contract

    // An address who has permissions to mint Dogs
    address public minter;

    mapping(uint256 => uint256) public winningBid;

    mapping(uint256 => int96) public flowRates;
    struct Flow {
        uint256 tokenId;
        uint256 timestamp;
        int96 flowRate;
    }
    mapping(uint256 => Flow[]) private flowsForToken;
    
    uint256 public lastId; // this is so we can increment the number

    // IPFS content hash of contract-level metadata
    string private _contractURIHash = 'QmYuKfPPTT14eTHsiaprGrTpuSU5Gzyq7EjMwwoPZvaB6o';

    modifier onlyMinter() {
        require(msg.sender == minter, 'Sender is not the minter');
        _;
    }
    modifier onlyMinterOrOwner() {
        require( (msg.sender == minter) || (msg.sender == owner()), 'Sender is not the minter nor owner');
        _;
    }

    constructor(address _tokenVestor) 
        
        // hardcoding to make testing faster
        ERC721(
            "Degen Dog",//_name,  
            "DOG"//_symbol
            ) {

        vestor = ITokenVestor(_tokenVestor);

        // chainlink ETH/DAI on Kovan
        priceFeed = AggregatorV3Interface(0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541);

        // defaults
        streamSettings = Streamonomics(10, 20, 10, 40, 1000);

    }

    function setStreamonomics(uint256 _percentagetoCurrent, uint256 _percentagetoDogsBefore, uint256 _dogsBefore, uint256 _percentageShared, uint256 _dogsShared) external onlyOwner {
        // TODO: add require validation here
        streamSettings.percentagetoCurrent = _percentagetoCurrent;
        streamSettings.percentagetoDogsBefore = _percentagetoDogsBefore;
        streamSettings.dogsBefore = _dogsBefore;
        streamSettings.percentageShared = _percentageShared;
        streamSettings.dogsShared = _dogsShared;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://degendogs.club/meta/";
    }

    /**
     * Returns the latest price
     */
    function _chainlink_price() internal returns (int) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }

    function _swap(uint256 amountIn) internal returns (uint256) {
        uint256 min = uint256( _chainlink_price() );
        min = min.mul(97);
        min = min.div(100);

        uint256 deadline = block.timestamp + 15;
        address tokenIn = WETH9;
        address tokenOut = DAI;
        uint24 fee = 3000;
        address recipient = address(this);
        uint256 amountOutMinimum = min;
        uint160 sqrtPriceLimitX96 = 0;

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams(
            tokenIn,
            tokenOut,
            fee,
            recipient,
            deadline,
            amountIn,
            amountOutMinimum,
            sqrtPriceLimitX96
        );

        uint256 amountOut = uniswapRouter.exactInputSingle{ value: amountIn }(params);
        uniswapRouter.refundETH();

        return amountOut;
    }

    function _comp(uint256 tokens) internal returns (uint256) {
        // Create a reference to the underlying asset contract, like DAI.
        Erc20 underlying = Erc20(DAI);

        // Create a reference to the corresponding cToken contract, like cDAI
        CErc20 cToken = CErc20(cDAI);

        uint256 _numTokensBefore = cToken.balanceOf(address(this));

        uint256 _numTokensToSupply = tokens;

        // Approve transfer on the ERC20 contract
        underlying.approve(cDAI, _numTokensToSupply);

         // Mint cTokens
        uint256 mintResult = cToken.mint(_numTokensToSupply); // does not return number of cTokens

        uint256 _numTokensAfter = cToken.balanceOf(address(this));
        uint256 cTokens = _numTokensAfter.sub(_numTokensBefore);

        return cTokens;
    }

    function claimComp() external onlyOwner{
        _claimComp();
    }

    function _claimComp() internal {
        ICompoundComptroller troll = ICompoundComptroller(comptroller);
        troll.claimComp(address(this));
    }

    function _super(uint256 aTokens) internal {
        // Create a reference to the underlying asset contract, like DAI.
        Erc20 underlying = Erc20(amWETH);

        uint256 _numTokensToSupply = aTokens;

        // TODO: still need this?
        uint256 amount = _numTokensToSupply * (10 ** (18 - underlying.decimals()));

        // Approve transfer on the ERC20 contract
        underlying.approve(amWETHx, _numTokensToSupply);

        // Mint super tokens
        //_acceptedToken.upgrade(amount);
    }

    function _idle(uint256 tokens) internal returns (uint256) {
        Erc20 underlying = Erc20(WETH9);
        IIdleToken iToken = IIdleToken(idleWETH);
        uint256 _numTokensBefore = iToken.balanceOf(address(this));
        uint256 _numTokensToSupply = tokens;
        underlying.approve(idleWETH, _numTokensToSupply);
        uint256 mintResult = iToken.mintIdleToken(_numTokensToSupply, true, address(this));  // TODO: what is best address for referral?
        uint256 _numTokensAfter = iToken.balanceOf(address(this));
        uint256 iTokens = _numTokensAfter.sub(_numTokensBefore);
        return iTokens;
    }

    function _defi(uint256 amount, uint256 tokenId) internal {
        IERC20 token = IERC20(WETH9);
        uint256 beforeBalance = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 afterBalance = token.balanceOf(address(this));
        require(beforeBalance.add(amount) == afterBalance, "Token transfer call did not transfer expected amount");

        //uint256 tokens = _swap(amount); // ETH for DAI
        uint256 iTokens = _idle(amount);  // WETH for amWETH
        //_super(aTokens.div(10)); // 10% of amWETH upgraded to amWETHx
        uint256 depAmount = iTokens.div(10); // TODO: base this on reserve strategy
        IIdleToken iToken = IIdleToken(idleWETH);
        iToken.approve(address(vestor), depAmount);
        vestor.deposit(IERC20(idleWETH), depAmount);
        //TODO: what to do with the other 90% ... to timelock?
    }

    // temporary functions for dev because I keep losing all my faucet ETH to older versions of contracts!!
    function withdrawToken(address _tokenContract) external onlyOwner {
        IERC20 tokenContract = IERC20(_tokenContract);

        // transfer the token from address of this contract
        // to address of the user (executing the withdrawToken() function)
        tokenContract.transfer(msg.sender, tokenContract.balanceOf(address(this)) );
    }
    function withdrawETH() external payable onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    // @dev creates the NFT, but it remains in the contract
    function mint() external onlyMinterOrOwner returns (uint256) {
        //flowRates[lastId] = flowRate;
        _mint(owner(), address(this), lastId);
        uint256 dogId = lastId;
        lastId += 1;
        return dogId;
    }
    
    event NFTIssued(uint256 indexed tokenId, address indexed owner);
    
    // @dev issues the NFT, transferring it to a new owner, and starting the stream
    function issue(address newOwner, uint256 tokenId, uint256 amount) external onlyMinterOrOwner {
        console.log("start issue");
        require(newOwner != address(this), "Issue to a new address");
        require(ownerOf(tokenId) == address(this), "NFT already issued");
        if (amount > 0) {
            _defi(amount, tokenId);
        }

        winningBid[tokenId] = amount;
        //_claimComp();
        emit NFTIssued(tokenId, newOwner);
        this.safeTransferFrom(address(this), newOwner, tokenId);
    }

    function _beforeTokenTransfer(
        address oldReceiver,
        address newReceiver,
        uint256 tokenId
    ) internal override(ERC721, ERC721Checkpointable) {
        super._beforeTokenTransfer(oldReceiver, newReceiver, tokenId);
        require(newReceiver != address(0), "New receiver is zero address");
        // @dev because our app is registered as final, we can't take downstream apps

        if ( oldReceiver == address(this) ) {
            uint256 _amount = winningBid[tokenId];
            //uint256 _super = sTokensForDog[tokenId];
            uint256 _super = _amount;  // TEMP: CHANGE THIS!!!!
            flowRates[tokenId] = 0;
            // 10% back to inital owner
            flowsForToken[tokenId].push(Flow(
                {
                    tokenId: tokenId,
                    timestamp: block.timestamp + 365*24*60*60,
                    flowRate: int96(uint96(_super.div(10).div(31536000)))
                }
            ));
            
            // shared portion: 40% of proceeds
            for (uint256 i = 0; i < lastId; i++) {
                flowsForToken[tokenId].push(Flow(
                    {
                        tokenId: i,
                        timestamp: block.timestamp + 365*24*60*60,
                        flowRate: int96(uint96(_super.div(10).mul(4).div(lastId).div(31536000)))
                    }
                ));
            }
            // 20% to the 10 before Dog owner
            if (tokenId > 9) {
                flowsForToken[tokenId].push(Flow(
                    {
                        tokenId: tokenId - 10,
                        timestamp: block.timestamp + 365*24*60*60,
                        flowRate: int96(uint96(_super.div(5).div(31536000)))
                    }
                ));
            }

            for (uint256 i = 0; i < flowsForToken[tokenId].length; i++) {
                address receiver = ownerOf(flowsForToken[tokenId][i].tokenId);
                if ( flowsForToken[tokenId][i].tokenId == tokenId) {
                    receiver = newReceiver;
                }
                //_createOrRedirectFlows(oldReceiver, receiver, flowsForToken[tokenId][i].flowRate);
                if ( receiver != address(this) ) {
                    bytes32 ref = keccak256(abi.encode(address(this), tokenId));
                    vestor.registerFlow(receiver, flowsForToken[tokenId][i].flowRate, false, block.timestamp - 1, 365*24*60*60, 0, ref);
                    flowRates[flowsForToken[tokenId][i].tokenId] += flowsForToken[tokenId][i].flowRate;
                }
            }

        } else {
            if (newReceiver != address(this)) {
                // being transferred to new owner - redirect the flow
                //console.log("ready to redirectStreams", oldReceiver, newReceiver);
                //console.logBytes32( keccak256(abi.encode(address(this), tokenId)) );
                vestor.redirectStreams(oldReceiver, newReceiver, keccak256(abi.encode(address(this), tokenId)));
                //console.log("after redirectStreams");
            }
        }
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    /**
     * @notice The IPFS URI of contract-level metadata.
     */
    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked('ipfs://', _contractURIHash));
    }

    /**
     * @notice Set the _contractURIHash.
     * @dev Only callable by the owner.
     */
    function setContractURIHash(string memory newContractURIHash) external onlyOwner {
        _contractURIHash = newContractURIHash;
    }

    receive() external payable {
        //_defi(msg.value);
    }
}
