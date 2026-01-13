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

        // Prevent setting too many streamonomics that could cause gas issues
        require(percentage.length <= 100, "Too many streamonomics");

     
        emit StreamonomicsDeleted(streamonomics.length);
        delete streamonomics;

      uint256 totalPercentage;
        uint256 previousLimit;
        
        for(uint i = 0; i < percentage.length; i++) {
            // Validate percentage is reasonable (0-100)
            require(percentage[i] <= 100, "Percentage exceeds 100");
            
            // Validate start <= limit
            require(start[i] <= limit[i], "Start must be <= limit");
            
            // Validate step is not zero (unless start == limit)
            if (start[i] < limit[i]) {
                require(step[i] > 0, "Step must be > 0 when start < limit");
            }
            
            // Check for non-overlapping ranges in ascending order
            // This assumes streamonomics should be in ascending order of ranges
            if (i > 0) {
                require(start[i] > previousLimit, "Ranges overlap or not in order");
            }
            
            // Check for duplicate entries
            for (uint j = 0; j < i; j++) {
                require(
                    percentage[i] != percentage[j] ||
                    start[i] != start[j] ||
                    step[i] != step[j] ||
                    limit[i] != limit[j],
                    "Duplicate streamonomic entry"
                );
            }
            
            streamonomics.push(Streamonomic(percentage[i], start[i], step[i], limit[i]));
            emit StreamonomicAdded(percentage[i], start[i], step[i], limit[i]);
            
            totalPercentage += percentage[i];
            previousLimit = limit[i];
            
            // Check for overflow (very unlikely with percentages, but good practice)
            require(totalPercentage >= percentage[i], "Percentage addition overflow");
        }
        
        require(totalPercentage <= 100, "Total percentage exceeds 100");
    }

    function getStreamonomics() external view returns(Streamonomic[] memory) {
        return streamonomics;
    }

}
