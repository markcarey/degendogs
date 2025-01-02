// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

interface ERC20Hooks {
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) external;
}

contract StakedToken is ERC20, ERC20Burnable, AccessControl {
    IERC20 public token;
    ERC20Hooks public hooks;

    constructor(address defaultAdmin, string memory name, string memory symbol, address stakeableToken, ERC20Hooks _hooks)
        ERC20(name, symbol)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        token = IERC20(stakeableToken);
        hooks = _hooks;
    }

    function stake(address to, uint256 amount) public {
        token.transferFrom(msg.sender, address(this), amount);  // Transfer the stakable token to this contract
        _mint(to, amount);
    }

    function unstake(address to, uint256 amount) public {
        _burn(msg.sender, amount);
        token.transfer(to, amount);  // Transfer the stakable token back to the user
    }

    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20)
    {
        if (address(hooks) != address(0)) {
            hooks._beforeTokenTransfer(from, to, amount);
        }
        super._update(from, to, amount);
    }
}