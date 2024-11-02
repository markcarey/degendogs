// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC721Drop {
    /// @notice Sales states and configuration
    /// @dev Uses 3 storage slots
    struct SalesConfiguration {
        /// @dev Public sale price (max ether value > 1000 ether with this value)
        uint104 publicSalePrice;
        /// @notice Purchase mint limit per address (if set to 0 === unlimited mints)
        /// @dev Max purchase number per txn (90+32 = 122)
        uint32 maxSalePurchasePerAddress;
        /// @dev uint64 type allows for dates into 292 billion years
        /// @notice Public sale start timestamp (136+64 = 186)
        uint64 publicSaleStart;
        /// @notice Public sale end timestamp (186+64 = 250)
        uint64 publicSaleEnd;
        /// @notice Presale start timestamp
        /// @dev new storage slot
        uint64 presaleStart;
        /// @notice Presale end timestamp
        uint64 presaleEnd;
        /// @notice Presale merkle root
        bytes32 presaleMerkleRoot;
    }
    function salesConfig() external view returns (SalesConfiguration memory);

    /// @notice This is an admin mint function to mint a quantity to a specific address
    /// @param to address to mint to
    /// @param quantity quantity to mint
    /// @return the id of the first minted NFT
    function adminMint(address to, uint256 quantity) external returns (uint256);

    function mintWithRewards(address recipient, uint256 quantity, string calldata comment, address mintReferral) external payable returns (uint256);

    function royaltyInfo(uint256, uint256 _salePrice) external view returns (address receiver, uint256 royaltyAmount);

    function zoraFeeForAmount(uint256 quantity) external view returns (address payable recipient, uint256 fee);

    function balanceOf(address account) external view returns (uint256);

    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    function hasRole(bytes32 role, address account) external view returns (bool);
    

}