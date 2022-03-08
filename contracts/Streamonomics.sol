// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Streamonomics is Ownable {

    struct Streamonomic {
        uint256 percentage;
        uint256 start;
        uint256 step;
        uint256 limit;
    }
    Streamonomic[] public streamonomics;

    event StreamonomicAdded(
        uint256 percentage,
        uint256 start,
        uint256 step,
        uint256 limit
    );

    event StreamonomicsDeleted(
        uint256 length
    );

    function setStreamonomics(uint256[] calldata percentage, uint256[] calldata start, uint256[] calldata step, uint256[] calldata limit) external onlyOwner {
        require(percentage.length == start.length, "!len");
        require(start.length == step.length, "!len");
        require(step.length == limit.length, "!len");
        emit StreamonomicsDeleted(streamonomics.length);
        delete streamonomics;
        uint256 total;
        for(uint i = 0; i < percentage.length; i++) {
            streamonomics.push(Streamonomic(percentage[i], start[i], step[i], limit[i]));
            emit StreamonomicAdded(percentage[i], start[i], step[i], limit[i]);
            total += percentage[i];
        }
        require(total <= 100, "!>100");
    }

    function getStreamonomics() external view returns(Streamonomic[] memory) {
        return streamonomics;
    }

}