// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
//import {ILendingPool} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";

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

interface ICompoundComptroller {
    function claimComp(address holder) external;
}

interface ILendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
    function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external returns (uint256);
}

contract Dog is ERC721, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    AggregatorV3Interface internal priceFeed;


    // Kovan Contracts
    //IUniswapRouter public constant uniswapRouter = IUniswapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    //address private constant WETH9 = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
    //address private constant DAI = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;
    //address private constant cDAI = 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD;
    //address private constant cDAIx = 0x3ED99f859D586e043304ba80d8fAe201D4876D57;
    //address private constant comptroller = 0x5eAe89DC1C671724A672ff0630122ee834098657;

    // Mumbai Contracts
    IUniswapRouter public constant uniswapRouter = IUniswapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564); // 

    address private constant WETH9 = 0x3C68CE8504087f89c640D02d133646d98e64ddd9;
    address private constant DAI = 0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F;
    address private constant aaveLendingPool = 0x9198F13B08E299d85E096929fA9781A1E3d5d827;
    address private constant amWETH = 0x7aE20397Ca327721F013BB9e140C707F82871b56;
    address private constant amWETHx = 0x67A87A1daa04Da7aADA1787c1FaFd178553d9FE1;
   
    address private constant cDAI = 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD;
    address private constant cDAIx = 0x3ED99f859D586e043304ba80d8fAe201D4876D57;
    address private constant comptroller = 0x5eAe89DC1C671724A672ff0630122ee834098657;

    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token

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

    constructor() 
        
        // hardcoding to make testing faster
        ERC721(
            "Degen Dog",//_name,  
            "DOG"//_symbol
            ) {
                
        // Kovan:
        //_host = ISuperfluid(0xF0d7d1D47109bA426B9D8A3Cde1941327af1eea3);
        //_cfa = IConstantFlowAgreementV1(0xECa8056809e7e8db04A8fF6e4E82cD889a46FE2F);
        // Mumbai
        _host = ISuperfluid(0xEB796bdb90fFA0f28255275e16936D25d3418603);
        _cfa = IConstantFlowAgreementV1(0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873);
        _acceptedToken = ISuperToken(amWETHx);

        assert(address(_host) != address(0));
        assert(address(_cfa) != address(0));
        assert(address(_acceptedToken) != address(0));

        // chainlink ETH/DAI on Kovan
        priceFeed = AggregatorV3Interface(0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541);

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

    function _aave(uint256 tokens) internal returns (uint256) {
        // Create a reference to the corresponding aToken contract, like amWETH
        Erc20 aToken = Erc20(amWETH);
        uint256 _numTokensBefore = aToken.balanceOf(address(this));
        Erc20(WETH9).approve(aaveLendingPool, tokens);
        ILendingPool(aaveLendingPool).deposit(WETH9, tokens, address(this), 0);
        uint256 _numTokensAfter = aToken.balanceOf(address(this));
        return _numTokensAfter.sub(_numTokensBefore);
    }

    function _claimAaveRewards() internal {
        if ( block.chainid == 137 ) {
            // TODO: get balance https://docs.aave.com/developers/guides/liquidity-mining#getrewardsbalance
            // then if exceeds threshold:
            // https://docs.aave.com/developers/guides/liquidity-mining#claimrewards
            // polygon mainnet rewards at 0x357D51124f59836DeD84c8a1730D72B749d8BC23
        }
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
        _acceptedToken.upgrade(amount);
    }

    function _defi(uint256 amount, uint256 tokenId) internal {
        IERC20 token = IERC20(WETH9);
        uint256 beforeBalance = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 afterBalance = token.balanceOf(address(this));
        require(beforeBalance.add(amount) == afterBalance, "Token transfer call did not transfer expected amount");

        //uint256 tokens = _swap(amount); // ETH for DAI
        uint256 aTokens = _aave(amount);  // WETH for amWETH
        _super(aTokens.div(10)); // 10% of amWETH upgraded to amWETHx
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
        _mint(address(this), lastId);
        uint256 dogId = lastId;
        lastId += 1;
        return dogId;
    }
    
    event NFTIssued(uint256 indexed tokenId, address indexed owner);
    
    // @dev issues the NFT, transferring it to a new owner, and starting the stream
    function issue(address newOwner, uint256 tokenId, uint256 amount) external onlyMinterOrOwner {
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

    function close(uint256 tokenId) external {
        int96 closedFlowRate = _closeStreamsForToken(tokenId);
        flowRates[tokenId] -= closedFlowRate;
        IERC20 tokenContract = IERC20(cDAIx);
        // reward equivalent of 30 days of closed flow: 60*60*24*30 = 2592000
        tokenContract.transfer( msg.sender, uint256(uint96(closedFlowRate)).mul(2592000) );
    }

    function _closeStreamsForToken(uint256 tokenId) internal returns (int96 closedFlowRate) {
        int96 closed = 0;
        for (uint256 i = 0; i < flowsForToken[tokenId].length; i++) {
            if (block.timestamp > flowsForToken[tokenId][i].timestamp ) {
                address receiver = ownerOf(flowsForToken[tokenId][i].tokenId);
                int96 flowRate = flowsForToken[tokenId][i].flowRate;
                (, int96 outFlowRate, , ) = _cfa.getFlow(_acceptedToken, address(this), receiver); 
                if (outFlowRate == flowRate) {
                    _deleteFlow(address(this), receiver);
                } else if (outFlowRate > flowRate){
                    // reduce the outflow by flowRate
                    _updateFlow(receiver, outFlowRate - flowRate);
                }    
                closed += flowRate;
            }
        }
        return closed;
    }
    
    // TODO: add back before tranfer hook here when ready

    function _createOrRedirectFlows(
        address oldReceiver,
        address newReceiver,
        int96 flowRate
    ) internal {
        // @dev delete flow to old receiver
        (, int96 outFlowRate, , ) = _cfa.getFlow(_acceptedToken, address(this), oldReceiver); 
        if (outFlowRate == flowRate) {
            _deleteFlow(address(this), oldReceiver);
        } else if (outFlowRate > flowRate){
            // reduce the outflow by flowRate
            _updateFlow(oldReceiver, outFlowRate - flowRate);
        }        
                    
        // @dev create flow to new receiver
        // @dev if this is a new NFT, it will create a flow based on the stored flowrate
        (, outFlowRate, , ) = _cfa.getFlow(_acceptedToken, address(this), newReceiver);
        if (outFlowRate == 0) {
            if (newReceiver != address(this)) {
                _createFlow(newReceiver, flowRate);
            }
        } else {
            // increase the outflow by flowRate
            _updateFlow(newReceiver, outFlowRate + flowRate);
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
