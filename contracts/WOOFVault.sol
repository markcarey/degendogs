// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";


contract WOOFVault is AccessControl, Pausable {
    IERC20 public woof = IERC20(0x6D5EcD0509B47a78b750CA85cD1ec96D90f4cB3a); // WOOF token on Degen Chain
    address public dogMaster = 0xFe341be90f9c2Cc7e65Ef4e820f632aB6495b85E; // DogMaster.eth

    uint256 public constant MIN_DEPOSIT = 1_000_000 ether; // 1 million WOOF

    // @dev accounting:
    mapping(address => uint256) public deposits; // user address => amount of WOOF deposited
    address[] public depositors; // list of depositors

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, dogMaster);
        _grantRole(MANAGER_ROLE, dogMaster);
    }

    /**
     * @dev Deposit WOOF into the fund.
     * This function allows users to deposit WOOF into the fund.
     */
    function deposit(uint256 amount) external whenNotPaused {
        require(amount >= MIN_DEPOSIT, "Amount must be gte minDeposit");
        require(woof.transferFrom(msg.sender, address(this), amount), "WOOF transfer failed");
        // add depositor if first time
        if (deposits[msg.sender] == 0) {
            depositors.push(msg.sender);
        }
        deposits[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    /**
     * @dev Withdraw WOOF from the fund.
     * This function allows users to withdraw their deposited WOOF from the fund.
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        deposits[msg.sender] -= amount;
        // new balace must be greater than or equal to minDeposit
        require(deposits[msg.sender] == 0 || deposits[msg.sender] >= MIN_DEPOSIT, "Balance must be gte minDeposit or zero");
        if (deposits[msg.sender] == 0) {
            // remove depositor from list
            for (uint i = 0; i < depositors.length; i++) {
                if (depositors[i] == msg.sender) {
                    depositors[i] = depositors[depositors.length - 1];
                    depositors.pop();
                    break;
                }
            }
        }
        require(woof.transfer(msg.sender, amount), "WOOF transfer failed");
        emit Withdraw(msg.sender, amount);
    }

    function adminWithdraw(uint256 amount) external onlyRole(MANAGER_ROLE) {
        require(amount > 0, "Amount must be greater than zero");
        require(woof.transfer(msg.sender, amount), "WOOF transfer failed");
    }

    function membersWithUnits() external view returns (address[] memory, uint128[] memory units) {
        units = new uint128[](depositors.length);
        for (uint i = 0; i < depositors.length; i++) {
            address user = depositors[i];
            uint256 userDeposit = deposits[user];
            units[i] = _units(userDeposit);
        }
        return (depositors, units);
    }

    function _units(uint256 amount) internal pure returns (uint128) {
        return uint128(amount / (10 ** 18));
    }

    /**
     * @dev Get the balance of ETH for a user.
     * @param user The address of the user.
     * @return The balance of ETH for the user.
     */
    function balanceOf(address user) external view returns (uint256) {
        return deposits[user];  
    }
    /**
     * @dev Get the total balance of ETH in the fund.
     * @return The total balance of ETH in the fund.
     * This function returns the total amount of ETH that has been deposited into the fund.
     */
    function totalBalance() external view returns (uint256) {
        return woof.balanceOf(address(this));
    }

    /**
     * @dev Pause the contract, only callable by the manager.
     * This will prevent deposits ONLY, withdrawals will still be allowed.
     */
    function pause() external onlyRole(MANAGER_ROLE) {
        _pause();
    }
    /**
     * @dev Unpause the contract, only callable by the manager.
     */
    function unpause() external onlyRole(MANAGER_ROLE) {
        _unpause();
    }
    
}