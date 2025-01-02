// SPDX-License-Identifier: CC0-1.0
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface DistributionPool {
    function getUnits(address memberAddr) external view returns (uint128);
    function updateMemberUnits(address memberAddr, uint128 newUnits) external returns (bool);
}

contract ERC20PoolManager is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    address public token;
    DistributionPool public pool;
    uint256 public unitDecimals = 18;

    constructor(address _token, DistributionPool _pool) {
        token = _token;
        pool = _pool;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    function setPool(DistributionPool _pool) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC20PoolManager: must have manager role to set pool");
        pool = _pool;
    }

    function setToken(address _token) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC20PoolManager: must have manager role to set token");
        token = _token;
    }

    function setUnitDecimals(uint256 _unitDecimals) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC20PoolManager: must have manager role to set unit decimals");
        unitDecimals = _unitDecimals;
    }

    function updateMemberUnits(address memberAddr, uint128 newUnits) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC20PoolManager: must have manager role to update units");
        pool.updateMemberUnits(memberAddr, newUnits);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) external {
        // require that the caller is the NFT contract:
        require(msg.sender == token, "ERC20PoolManager: caller is not the token contract");
        uint128 transferUnits = uint128(amount / (10 ** unitDecimals));
        // first adjust sender's units:
        if (from != address(0)) {
            uint128 senderUnits = pool.getUnits(from);
            if (senderUnits > 0) {
                // newUnits is max(0, senderUnits - transferUnits):                
                uint128 newUnits = senderUnits > transferUnits ? senderUnits - transferUnits : 0;
                pool.updateMemberUnits(from, newUnits);
            }
        }
        // now adjust recipient's units:
        if (to != address(0)) {
            uint128 recipientUnits = pool.getUnits(to);
            pool.updateMemberUnits(to, recipientUnits + transferUnits);
        }
    }

}
    