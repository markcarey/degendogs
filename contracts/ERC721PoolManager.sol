// SPDX-License-Identifier: CC0-1.0
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface DistributionPool {
    function getUnits(address memberAddr) external view returns (uint128);
    function updateMemberUnits(address memberAddr, uint128 newUnits) external returns (bool);
}

contract ERC721PoolManager is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    address public nft;
    DistributionPool public pool;
    uint128 public unitIncrement = 1;

    constructor(address _nft, DistributionPool _pool) {
        nft = _nft;
        pool = _pool;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    function setPool(DistributionPool _pool) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC721PoolManager: must have manager role to set pool");
        pool = _pool;
    }

    function setNft(address _nft) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC721PoolManager: must have manager role to set NFT");
        nft = _nft;
    }

    function setUnitIncrement(uint128 _unitIncrement) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC721PoolManager: must have manager role to set unit increment");
        unitIncrement = _unitIncrement;
    }

    function updateMemberUnits(address memberAddr, uint128 newUnits) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC721PoolManager: must have manager role to update units");
        pool.updateMemberUnits(memberAddr, newUnits);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256,
        uint256
    ) external {
        // require that the caller is the NFT contract:
        require(msg.sender == nft, "ERC721PoolManager: caller is not the NFT contract");
        // first adjust sender's units:
        if (from != address(0)) {
            uint128 senderUnits = pool.getUnits(from);
            if (senderUnits > 0) {
                // newUnits is max(0, senderUnits - unitIncrement):
                uint128 newUnits = senderUnits > unitIncrement ? senderUnits - unitIncrement : 0;
                pool.updateMemberUnits(from, newUnits);
            }
        }
        // now adjust recipient's units:
        if (to != address(0)) {
            uint128 recipientUnits = pool.getUnits(to);
            pool.updateMemberUnits(to, recipientUnits + unitIncrement);
        }
    }

}
    