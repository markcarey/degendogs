// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import {
    ISuperfluid,
    ISuperToken,
    ISuperApp,
    ISuperAgreement,
    SuperAppDefinitions
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {
    IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

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

// Simple contract which allows users to create NFTs with attached streams

contract Dog is ERC721, Ownable {

    AggregatorV3Interface internal priceFeed;
    IUniswapRouter public constant uniswapRouter = IUniswapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    address private constant WETH9 = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
    address private constant DAI = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;
    address private constant cDAI = 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD;
    address private constant cDAIx = 0x3ED99f859D586e043304ba80d8fAe201D4876D57;

    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token

    mapping(uint256 => int96) public flowRates;
    
    uint256 public lastId; // this is so we can increment the number
    constructor(
        // string memory _name,
        // string memory _symbol,
        // ISuperfluid host,
        // IConstantFlowAgreementV1 cfa,
        // ISuperToken acceptedToken
        ) 
        
        // hardcoding to make testing faster
        ERC721(
            "NFT test",//_name,  
            "NFT"//_symbol
            ) {
                
            // just hardcoding to make testing faster
        _host = ISuperfluid(0x22ff293e14F1EC3A09B137e9e06084AFd63adDF9);
        _cfa = IConstantFlowAgreementV1(0xEd6BcbF6907D4feEEe8a8875543249bEa9D308E8);
        //_acceptedToken = ISuperToken(0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00);
        _acceptedToken = ISuperToken(cDAIx);

        assert(address(_host) != address(0));
        assert(address(_cfa) != address(0));
        assert(address(_acceptedToken) != address(0));

        // host =  0x22ff293e14F1EC3A09B137e9e06084AFd63adDF9
        // CFAv1 = 0xEd6BcbF6907D4feEEe8a8875543249bEa9D308E8
        // fDAIx = 0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00

        priceFeed = AggregatorV3Interface(0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541);

    }


    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }

    function convertExactEthToDai() external onlyOwner {
        //require(msg.value > 0, "Must pass non 0 ETH amount");

        uint256 deadline = block.timestamp + 15; // using 'now' for convenience, for mainnet pass deadline from frontend!
        address tokenIn = WETH9;
        address tokenOut = DAI;
        uint24 fee = 3000;
        address recipient = address(this);
        uint256 amountIn = address(this).balance; // msg.value; 
        uint256 amountOutMinimum = 0; // CHANGE THIS
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

        uniswapRouter.exactInputSingle{ value: amountIn }(params);
        uniswapRouter.refundETH();

        // refund leftover ETH to user
        //(bool success,) = msg.sender.call{ value: address(this).balance }("");
        //require(success, "refund failed");
    }

    function supplyDAIToCompound() external onlyOwner {
        // Create a reference to the underlying asset contract, like DAI.
        Erc20 underlying = Erc20(DAI);

        // Create a reference to the corresponding cToken contract, like cDAI
        CErc20 cToken = CErc20(cDAI);

        uint256 _numTokensToSupply = underlying.balanceOf(address(this));

        // Amount of current exchange rate from cToken to underlying
        //uint256 exchangeRateMantissa = cToken.exchangeRateCurrent();
        //emit MyLog("Exchange Rate (scaled up): ", exchangeRateMantissa);

        // Amount added to you supply balance this block
        //uint256 supplyRateMantissa = cToken.supplyRatePerBlock();
        //emit MyLog("Supply Rate: (scaled up)", supplyRateMantissa);

        // Approve transfer on the ERC20 contract
        underlying.approve(cDAI, _numTokensToSupply);

         // Mint cTokens
        uint mintResult = cToken.mint(_numTokensToSupply);
        //return mintResult;
    }

    function super() external onlyOwner {
        // Create a reference to the underlying asset contract, like DAI.
        CErc20 underlying = CErc20(cDAI);

        uint256 _numTokensToSupply = underlying.balanceOf(address(this));

        uint256 amount = _numTokensToSupply * (10 ** (18 - underlying.decimals()));

        // Approve transfer on the ERC20 contract
        underlying.approve(cDAIx, _numTokensToSupply);

        // Mint super tokens
        _acceptedToken.upgrade(amount);
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
    function createNFT(int96 flowRate) external onlyOwner{
        // creates an NFT based on a set flowRate and duration
        flowRates[lastId] = flowRate;
        _mint(address(this), lastId);
        lastId += 1;
    }
    
    event NFTIssued(uint256 indexed tokenId, address indexed owner, int96 indexed flowRate);
    
    // @dev issues the NFT, transferring it to a new owner, and starting the stream
    function issueNFT(uint256 tokenId, address newOwner) external onlyOwner {
        require(newOwner != address(this), "Issue to a new address");
        require(ownerOf(tokenId) == address(this), "NFT already issued");
        emit NFTIssued(tokenId, newOwner, flowRates[tokenId]);
        this.safeTransferFrom(address(this), newOwner, tokenId);
    }
    
    function createAndIssue(address receiver, int96 flowRate) external onlyOwner{
        require(receiver != address(this), "Issue to a new address");
        //emit NFTIssued(tokenId, newOwner, flowRates[tokenId]);
        flowRates[lastId] = flowRate;
        _mint(receiver, lastId);
        lastId += 1;
    }
    
    
    // @dev owner can edit the NFT as long as it hasn't been issued (transferred out) yet
    function editNFT(uint256 tokenId, int96 flowRate) external onlyOwner{
        // edits an NFT that is still in control of the app
        address receiver = ownerOf(tokenId);
        if(receiver != address(this)){
            (, int96 outFlowRate, , ) = _cfa.getFlow(_acceptedToken, address(this), receiver); 
            if(flowRate == 0){
                if(outFlowRate == flowRates[tokenId]) {
                    _deleteFlow(address(this), receiver);
                } else { 
                    _updateFlow(receiver, outFlowRate - flowRates[tokenId] + flowRate);
                }
            }
            else {
                if(outFlowRate == 0){
                    _createFlow(receiver, flowRate);
                } else{
                    _updateFlow(receiver, outFlowRate - flowRates[tokenId] + flowRate);
                }
            }
        }
        flowRates[tokenId] = flowRate;
    }
    
    
      //now I will insert a hook in the _transfer, executing every time the token is moved
      //When the token is first "issued", i.e. moved from the first contract, it will start the stream 
    function _beforeTokenTransfer(
        address oldReceiver,
        address newReceiver,
        uint256 tokenId
    ) internal override {
            require(newReceiver != address(0), "New receiver is zero address");
            // @dev because our app is registered as final, we can't take downstream apps
            
            //blocks transfers to superApps
            require(!_host.isApp(ISuperApp(newReceiver)) || newReceiver == address(this), "New receiver can not be a superApp");

            // @dev delete flow to old receiver
            //CHECK: unclear what happens if oldReceiver is address(this)
            (, int96 outFlowRate, , ) = _cfa.getFlow(_acceptedToken, address(this), oldReceiver); 
            if (outFlowRate == flowRates[tokenId]) {
                _deleteFlow(address(this), oldReceiver);
            } else if (outFlowRate > flowRates[tokenId]){
                // reduce the outflow by flowRates[tokenId;
                _updateFlow(oldReceiver, outFlowRate - flowRates[tokenId]);
            }        
                         
            // @dev create flow to new receiver
            // @dev if this is a new NFT, it will create a flow based on the stored flowrate
            (, outFlowRate, , ) = _cfa.getFlow(_acceptedToken, address(this), newReceiver); //CHECK: unclear what happens if flow doesn't exist.
            if (outFlowRate == 0) {
                if(newReceiver != address(this)) _createFlow(newReceiver, flowRates[tokenId]);
            } else {
                // increase the outflow by flowRates[tokenId]
                _updateFlow(newReceiver, outFlowRate + flowRates[tokenId]);
            }
      }
    
    
    /**************************************************************************
     * Library
     *************************************************************************/
    function _createFlow(address to, int96 flowRate) internal {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.createFlow.selector,
                _acceptedToken,
                to,
                flowRate,
                new bytes(0) // placeholder
            ),
            "0x"
        );
    }
    
    function _updateFlow(address to, int96 flowRate) internal {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                to,
                flowRate,
                new bytes(0) // placeholder
            ),
            "0x"
        );
    }
    
    function _deleteFlow(address from, address to) internal {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.deleteFlow.selector,
                _acceptedToken,
                from,
                to,
                new bytes(0) // placeholder
            ),
            "0x"
        );
    }

    receive() external payable {
        // custom function code
    }
}
