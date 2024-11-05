// SPDX-License-Identifier: CC0-1.0
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";
//import "@openzeppelin/contracts/utils/Strings.sol";
//import "@openzeppelin/contracts/utils/Base64.sol";

interface ERC721Hooks {
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) external;
}

contract DegenDog is ERC721, AccessControl, EIP712, ERC721Votes, IERC4906, Ownable  {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;
    address private _owner;
    string public metadataBaseURI;
    ERC721Hooks public hooks;

    mapping(uint256 => string) public tokenURIs;

    event BaseURIUpdated(
        string oldURI,
        string newURI
    );

    event HookUpdated(
        address oldHook,
        address newHook
    );

    constructor(string memory name, string memory symbol, string memory uri, address owner, ERC721Hooks _hooks)
        ERC721(name, symbol) EIP712(name, "1") Ownable(owner)
    {
        //_transferOwnership(owner);
        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(MINTER_ROLE, owner);
        metadataBaseURI = uri;
        _owner = owner;
        hooks = _hooks;
        // start ids at 201 because 0-200 were minted on Polygon
        _nextTokenId = 201;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return metadataBaseURI;
    }
    function setBaseURI(string calldata _uri) public onlyRole(DEFAULT_ADMIN_ROLE) {
        emit BaseURIUpdated(metadataBaseURI, _uri);
        metadataBaseURI = _uri;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        if ( bytes(tokenURIs[tokenId]).length > 0 ) {
            return tokenURIs[tokenId];
        } else {
            return super.tokenURI(tokenId);
        }
    }

    /**
     * @notice Mints a token to {to}
     * @dev Permissioned, only MINTER_ROLE can mint -- could be server EOA or minter contract (ie. auctionHouse)
     */
    function mintTo(address to) public onlyRole(MINTER_ROLE) {
        if (_nextTokenId <= 420 && _nextTokenId % 11 == 0) {
            // see https://docs.degendogs.club/basics/founders-reward
            _safeMint(_owner, _nextTokenId++);
        }
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    
    /**
     * @notice Mints a token to msg.sender
     * @dev Requires MINTER_ROLE, mints to msg.sender -- used by AuctionHouse contract
     */
    function mint() public onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        if (_nextTokenId <= 420 && _nextTokenId % 11 == 0) {
            // see https://docs.degendogs.club/basics/founders-reward
            _mint(_owner, _nextTokenId++);
        }
        tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
    }


    /**
     * @notice Mints an explict tokenid to {to}
     * @dev Permissioned, used for claiming Dogs minted previously on Polygon, tokenIds 0-200
     */
    function airdrop(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
        require(_ownerOf(tokenId) == address(0), "Token already minted");
        require(tokenId < 201, "TokenId out of range");
        _safeMint(to, tokenId);
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function setHooks(ERC721Hooks _hooks) public onlyRole(DEFAULT_ADMIN_ROLE) {
        emit HookUpdated(address(hooks), address(_hooks));
        hooks = _hooks;
    }

    /**
     * @notice Sets and freezes explict tokenURI for {_id}
     * @dev Future use, to optionally freeze metadata to decentralized storage
     */
    function freezeTokenURI(string calldata _uri, uint256 _id) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(tokenURIs[_id]).length == 0, "fzn");
        tokenURIs[_id] = _uri;
        emit MetadataUpdate(_id);
    }

    // The following functions are overrides required by Solidity.
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Votes)
        returns (address)
    {
        if (address(hooks) != address(0)) {
            address from = _ownerOf(tokenId);
            hooks._beforeTokenTransfer(from, to, tokenId, 1);
        }
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Votes)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, IERC165, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
