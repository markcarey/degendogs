// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './Streamonomics.sol';
import { ERC721 } from './base/ERC721.sol';
import './base/ERC721Enumerable.sol';
import { ERC721Checkpointable } from './base/ERC721Checkpointable.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ITokenVestor {
    function deposit(IERC20 token, uint256 amount) external;
    function flowTokenBalance() external returns (uint256);
    function getNetFlow() external returns (int96);
    function registerFlow(address adr, int96 flowRate, bool isPermanent, uint256 cliffEnd, uint256 vestingDuration, uint256 cliffAmount, bytes32 ref) external;
    function redirectStreams(address oldRecipient, address newRecipient, bytes32 ref) external;
}

interface IDAOSuperApp {
    function deposit(address tokenAddress, uint _amount, address beneficiary) external;
}

interface IIdleToken {
    function token() external view returns (address underlying);
    function mintIdleToken(uint256 _amount, bool _skipWholeRebalance, address _referral) external returns (uint256 mintedTokens);
    function tokenPrice() external view returns (uint256 price);
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external returns (uint256);
}

contract Dog is ERC721, ERC721Checkpointable, Ownable, Streamonomics {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // @dev The dogMaster address (founders)
    address public dogMaster;

    address private idleWETH;
    address private weth;

    // @dev Token Vesting contract
    ITokenVestor private vestor;

    // @dev An address who has permissions to mint Dogs
    address public minter;

    address public treasury;

    IDAOSuperApp public donationDAO;
    uint256 public donationPercentage = 10;

    mapping(uint256 => uint256) public winningBid;

    mapping(uint256 => string) public tokenURIs;
    
    uint256 public lastId;

    // @dev default to 4 weeks
    uint256 public reserveDuration = 60*60*24*28;

    // @dev optional delay to starting streams, requiring a separate txn to launch them
    uint256 public flowDelay;

    // @dev IPFS content hash of contract-level metadata
    string private _contractURIHash = "QmYuKfPPTT14eTHsiaprGrTpuSU5Gzyq7EjMwwoPZvaB6o";
    string public metadataBaseURI;

    event TreasuryUpdated(
        address oldAddress,
        address newAddress
    );

    event VaultUpdated(
        address oldAddress,
        address newAddress
    );

    event VestorUpdated(
        address oldAddress,
        address newAddress
    );

    event MinterUpdated(
        address oldAddress,
        address newAddress
    );

    event DonationPercentageUpdated(
        uint256 oldPercentage,
        uint256 newPercentage
    );

    event ReserveDurationUpdated(
        uint256 oldDuration,
        uint256 newDuration
    );

    event BaseURIUpdated(
        string oldURI,
        string newURI
    );

    event DogMasterUpdated(
        address dogMaster
    );

    event DogCreated(
        uint256 tokenId
    );

    event NFTIssued(
        uint256 indexed tokenId, 
        address indexed owner
    );

    event PermanentURI(
        string _value, 
        uint256 indexed _id
    );

    modifier onlyMinter() {
        require(msg.sender == minter, '!m');
        _;
    }
    modifier onlyMinterOrOwner() {
        require( (msg.sender == minter) || (msg.sender == owner()), '!m||o');
        _;
    }

    /**
     * @notice Require that the sender is the dogMaster.
     */
    modifier onlyDogMaster() {
        require(msg.sender == dogMaster, '!dM');
        _;
    }

    constructor(
        address _tokenVestor, 
        address _donationDAO, 
        address _weth, 
        address _idletoken, 
        address _dogMaster,
        string memory _name, 
        string memory _symbol,
        string memory _metadataBaseURI
        ) 
        ERC721(_name, _symbol) {

        vestor = ITokenVestor(_tokenVestor);
        donationDAO = IDAOSuperApp(_donationDAO);
        weth = _weth;
        idleWETH = _idletoken;
        dogMaster = _dogMaster;
        metadataBaseURI = _metadataBaseURI;

        // @dev default streamonomics -- can be replaced with setStreamonomics
        streamonomics.push(Streamonomic(10,1,1,1));
        streamonomics.push(Streamonomic(30,1,5,20));
        streamonomics.push(Streamonomic(10,10,1,1));
    }

    function setVestor(address _vestor) external onlyOwner {
        emit VestorUpdated(address(vestor), _vestor);
        vestor = ITokenVestor(_vestor);
    }

    function _targetReserves() internal returns(uint256 targetReserves) {
        int96 totalFlowRate = vestor.getNetFlow() * -1;
        targetReserves = uint256(uint96(totalFlowRate)).mul(reserveDuration);
    }
    function setreserveDuration(uint256 _duration) external onlyOwner {
        require(_duration > 0, "!0");
        emit ReserveDurationUpdated(reserveDuration, _duration);
        reserveDuration = _duration;
    }
    function _targetReserveForAmount(uint256 amt) internal view returns(uint256 reserve) {
        uint256 pct;
        for(uint i = 0; i < streamonomics.length; i++) {
            pct += streamonomics[i].percentage;
        }
        reserve = amt.mul(pct).div(100).div(31536000).mul(reserveDuration);
    }

    function setTreasury(address _treasury) external onlyOwner {
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    // @dev for emergency use only, in the event that idleWETH changes or stops functioning
    function setVault(address _vault) external onlyOwner {
        emit VaultUpdated(idleWETH, _vault);
        idleWETH = _vault;
    }

    function setDonationPercentage(uint256 _pct) external onlyOwner {
        emit DonationPercentageUpdated(donationPercentage, _pct);
        uint256 streamPct;
        for(uint i = 0; i < streamonomics.length; i++) {
            streamPct += streamonomics[i].percentage;
        }
        require(_pct <= (100 - streamPct), "!>100");
        donationPercentage = _pct;
    }

    function setFlowDelay(uint256 _seconds) external onlyOwner {
        flowDelay = _seconds;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return metadataBaseURI;
    }
    function setBaseURI(string calldata _uri) external onlyOwner {
        emit BaseURIUpdated(metadataBaseURI, _uri);
        metadataBaseURI = _uri;
    }

    function _getTreasury() internal view returns(address) {
        if ( treasury != address(0) ) {
            return treasury;
        } else {
            return address(this);
        }
    }

    function _idle(uint256 tokens) internal returns (uint256) {
        IERC20 underlying = IERC20(weth);
        IIdleToken iToken = IIdleToken(idleWETH);
        uint256 _numTokensBefore = iToken.balanceOf(address(this));
        uint256 _numTokensToSupply = tokens;
        underlying.approve(idleWETH, _numTokensToSupply);
        iToken.mintIdleToken(_numTokensToSupply, true, _getTreasury());
        uint256 _numTokensAfter = iToken.balanceOf(address(this));
        uint256 iTokens = _numTokensAfter.sub(_numTokensBefore);
        return iTokens;
    }

    function _defi(uint256 amount, address newOwner, uint256 tokenId) internal returns(uint256) {
        IERC20 token = IERC20(weth);
        IIdleToken iToken = IIdleToken(idleWETH);
        uint256 beforeBalance = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 afterBalance = token.balanceOf(address(this));
        require(beforeBalance.add(amount) == afterBalance, "!amt");
        
        uint256 toIdleAmount = amount;
        if ( address(donationDAO) != address(0) ) {
            if (donationPercentage > 0) {
                uint256 donationAmount = amount.mul(donationPercentage).div(100);
                if (tokenId == 1) {
                    // @dev 100% donation for Dog#1: Ukraine Dog
                    donationAmount = amount;
                }
                token.approve(address(donationDAO), donationAmount);
                donationDAO.deposit(weth, donationAmount, newOwner);
                toIdleAmount -= donationAmount;
            }
        }
        
        if (toIdleAmount == 0) {
            return 0;
        } else {
            _idle(toIdleAmount);
            uint256 price = iToken.tokenPrice();
            uint256 estTokens = amount.mul(10**18).div(price);

            uint256 vestorBalance = vestor.flowTokenBalance();
            uint256 target = _targetReserves().add(_targetReserveForAmount(estTokens));
            if ( target > vestorBalance ) {
                uint256 depAmount = target.sub(vestorBalance);
                iToken.approve(address(vestor), depAmount);
                vestor.deposit(IERC20(idleWETH), depAmount);
            }
            uint256 iBalance = iToken.balanceOf(address(this));
            if ( treasury != address(0) ) {
                iToken.transfer(treasury, iBalance);
            }
            return estTokens;
        }
    }

    function withdrawToken(address _tokenContract) external onlyOwner {
        IERC20 tokenContract = IERC20(_tokenContract);
        tokenContract.transfer(msg.sender, tokenContract.balanceOf(address(this)) );
    }
    function withdrawETH() external payable onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    /**
     * @notice Mint a Dog, along with a possible dogMaster reward
     * Dog. Dogmaster reward Dogs are minted every 11 Dogs, starting at 0,
     * until 420 Dogs have been minted (~1 year).
     * @dev Call _mint with the to address(es).
     */
    function mint() external onlyMinterOrOwner returns (uint256) {
        if (lastId <= 420 && lastId % 11 == 0) {
            _mint(owner(), dogMaster, lastId);
            emit DogCreated(lastId);
            lastId++;
        }
        _mint(owner(), address(this), lastId);
        emit DogCreated(lastId);
        lastId++;
        return lastId - 1;
    }
    
    // @dev issues the NFT, transferring it to a new owner, and starting the streams
    function issue(address newOwner, uint256 tokenId, uint256 amount) external onlyMinterOrOwner {
        require(newOwner != address(this), "!me");
        require(ownerOf(tokenId) == address(this), "done");
        uint256 iTokensAmount;
        if (amount > 0) {
            iTokensAmount = _defi(amount, newOwner, tokenId);
        } else {
            newOwner = _getTreasury();
        }
        if (newOwner != address(this) ) {
            winningBid[tokenId] = iTokensAmount;
            emit NFTIssued(tokenId, newOwner);
            this.safeTransferFrom(address(this), newOwner, tokenId);
        }
    }

    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        if ( bytes(tokenURIs[tokenId]).length > 0 ) {
            return tokenURIs[tokenId];
        } else {
            return super.tokenURI(tokenId);
        }
    }

    function _beforeTokenTransfer(
        address oldReceiver,
        address newReceiver,
        uint256 tokenId
    ) internal override(ERC721, ERC721Checkpointable) {
        super._beforeTokenTransfer(oldReceiver, newReceiver, tokenId);
        require(newReceiver != address(0), "!0x");

        if ( oldReceiver == address(this) ) {
            uint256 _amount = winningBid[tokenId];

            if (_amount > 0) {

                // @dev loop through streamonomics rules
                for(uint i = 0; i < streamonomics.length; i++) {
                    Streamonomic memory rule = streamonomics[i];
                    // @dev skip the rule if we are too early for it to apply
                    if ( rule.start <= tokenId ) {
                        uint256 pieces = rule.limit;
                        if ( tokenId.sub(rule.start) < rule.step.mul(rule.limit) ) {
                            // @dev share with < rule.limit tokens
                            pieces = tokenId.sub(rule.start).div(rule.step) + 1;
                        }
                        uint256 share = _amount.mul(rule.percentage).div(pieces).div(100);
                        int96 flowRate = int96(uint96(share.div(31536000)));
                        uint256 latest = tokenId - rule.start;
                        uint256 count;
                        // @dev start from current tokenId and move backwards based on `start` and `step` increments
                        for(uint256 j = latest; j >= 0; j -= rule.step) {
                            count++;
                            address receiver = ownerOf(j);
                            if ( receiver != address(this) ) {
                                bytes32 ref = keccak256(abi.encode(address(this), j));
                                vestor.registerFlow(receiver, flowRate, false, block.timestamp.sub(1).add(flowDelay), 31536000, 0, ref);
                            }
                            // @dev check if next j iteration takes us below zero
                            if ( rule.step > j ) {
                                break;
                            }
                            // @dev check limit
                            if ( count == rule.limit ) {
                                break;
                            }
                        }
                    }
                }

            }

        } else {
            if ( (newReceiver != address(this)) && (oldReceiver != address(0)) ) {
                // @dev being transferred to new owner - redirect the flow
                vestor.redirectStreams(oldReceiver, newReceiver, keccak256(abi.encode(address(this), tokenId)));
            }
        }
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setMinter(address _minter) external onlyOwner {
        emit MinterUpdated(minter, _minter);
        minter = _minter;
    }

    /**
     * @notice The IPFS URI of contract-level metadata.
     */
    function contractURI() external view returns (string memory) {
        return string(abi.encodePacked('ipfs://', _contractURIHash));
    }

    /**
     * @notice Set the _contractURIHash.
     * @dev Only callable by the owner.
     */
    function setContractURIHash(string memory newContractURIHash) external onlyOwner {
        _contractURIHash = newContractURIHash;
    }

    /**
     * @notice Set the dogMaster address.
     * @dev Only callable by the dogMaster.
     */
    function setDogMaster(address _dogMaster) external onlyDogMaster {
        dogMaster = _dogMaster;
        emit DogMasterUpdated(_dogMaster);
    }

    /**
     * @notice Sets and freezes explict tokenURI for {_id}
     * @dev Future use, to optionally freeze metadata to decentralized storage
     */
    function freezeTokenURI(string calldata _uri, uint256 _id) external onlyOwner {
        require(bytes(tokenURIs[_id]).length == 0, "fzn");
        tokenURIs[_id] = _uri;
        emit PermanentURI(_uri, _id);
    }

    receive() external payable {}
}
