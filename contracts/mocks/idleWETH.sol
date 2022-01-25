// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IdleWETH is ERC20, Ownable {
    constructor() ERC20("MOCK IdleWETH", "IdleWETH") {}

    function mintIdleToken(uint256 amount, bool skip, address referral) public returns (uint256) {
        _mint(msg.sender, amount);
        return amount;
    }

    function tokenPrice() public pure returns(uint256) {
        return 1e18;
    }
}