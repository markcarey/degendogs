// SPDX-License-Identifier: CC0-1.0
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.15;

//import "hardhat/console.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";

interface ISuperFluidPool {
    function getUnits(address memberAddr) external view returns (uint128);
    function updateMemberUnits(address memberAddr, uint128 newUnits) external returns (bool);
    function superToken() external view returns (address);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface ISuperToken {
    function upgrade(uint256 amount) external;
    function downgrade(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function getUnderlyingToken() external view returns (address tokenAddr);
    function allowance(address owner, address spender) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface GDAv1Forwarder {
    function getFlowDistributionFlowRate(address tokenAddress, address from, address to) external view returns (int96);
    function distributeFlow(address superTokenAddress, address from, address poolAddress, int96 requestedFlowRate, bytes calldata userData) external returns (bool);
    function distribute(address token, address from, address pool, uint256 requestedAmount, bytes calldata userData) external returns (bool);
}

contract PoolStreamer2 is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    address public nft;
    uint128 public unitIncrement = 10;

    ISuperFluidPool[] public pools;
    GDAv1Forwarder public gda;
    address[] public sources;
    int96 public streamPeriodSeconds;

    event SourceAdded(address source);
    event SourceRemoved(address source);

    event StreamUpdated(int96 oldFlowRate, int96 newFlowRate);

    constructor(GDAv1Forwarder _gda, ISuperFluidPool _pool, int96 _streamPeriodSeconds, address _nft) {
        gda = _gda;
        nft = _nft;
        if (address(_pool) != address(0)) {
            pools.push(_pool);
        }
        streamPeriodSeconds = _streamPeriodSeconds;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        //_underlyingToken().approve(address(_superToken()), type(uint256).max);
    }

    function addPool(ISuperFluidPool _pool) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "PoolStreamer: must have manager role to set pool");
        pools.push(_pool);
        //_underlyingToken().approve(address(_superToken()), type(uint256).max);
    }

    function removePool(ISuperFluidPool _pool) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "PoolStreamer: must have manager role to remove pool");
        bool found = false;
        for (uint256 i = 0; i < pools.length; i++) {
            if (address(pools[i]) == address(_pool)) {
                pools[i] = pools[pools.length - 1];
                pools.pop();
                found = true;
                break;
            }
        }
        require(found, "PoolStreamer: pool not found");
    }

    function setNft(address _nft) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC721PoolManager: must have manager role to set NFT");
        nft = _nft;
    }

    function setUnitIncrement(uint128 _unitIncrement) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC721PoolManager: must have manager role to set unit increment");
        unitIncrement = _unitIncrement;
    }

    function _updateMemberUnits(address memberAddr, uint128 newUnits) internal {
        for (uint256 i = 0; i < pools.length; i++) {
            ISuperFluidPool pool = pools[i];
            pool.updateMemberUnits(memberAddr, newUnits);
        }
    }

    function updateMemberUnits(address memberAddr, uint128 newUnits) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "ERC721PoolManager: must have manager role to update units");
        _updateMemberUnits(memberAddr, newUnits);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256,
        uint256
    ) external {
        // require that the caller is the NFT contract:
        require(msg.sender == nft, "ERC721PoolManager: caller is not the NFT contract");
        for (uint256 i = 0; i < pools.length; i++) {
            ISuperFluidPool pool = pools[i];
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
                try pool.updateMemberUnits(to, recipientUnits + unitIncrement) returns (bool) {
                    // success
                } catch {
                    // if recipient is contract that doesn't support receiving PoolMember NFTs, do nothing
                }
            }
        } // end loop through pools
    }

    function setStreamPeriodSeconds(int96 _streamPeriodSeconds) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "PoolStreamer: must have manager role to set stream period seconds");
        streamPeriodSeconds = _streamPeriodSeconds;
    }

    function registerSource(address source) external onlyRole(MANAGER_ROLE) {
        // require source is not already registered
        for (uint256 i = 0; i < sources.length; i++) {
            require(sources[i] != source, "PoolStreamer: source already registered");
        }
        // require max sources is 20
        require(sources.length < 20, "PoolStreamer: max sources reached");
        sources.push(source);
        emit SourceAdded(source);
    }

    function removeSource(address source) external onlyRole(MANAGER_ROLE) {
        // require source is registered
        bool found = false;
        // remove source from sources
        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i] == source) {
                sources[i] = sources[sources.length - 1];
                sources.pop();
                found = true;
                emit SourceRemoved(source);
                break;
            }
        }
        require(found, "PoolStreamer: source not registered");
    }

    function poolStream() external {
        // loop through each pool:
        for (uint256 p = 0; p < pools.length; p++) {
            ISuperFluidPool pool = pools[p];
            //console.log("pool: %s", address(pool));
            // loop through each source:
            for (uint256 i = 0; i < sources.length; i++) {
                address source = sources[i];
                //console.log("source: %s", source);
                // check if source has a positive balance
                if (_superToken(pool).balanceOf(source) > 0) {
                    //console.log("balance: %s", _superToken(pool).balanceOf(source));
                    // check if source has a positive allowance
                    if (_superToken(pool).allowance(source, address(this)) > 0) {
                        //console.log("allowance: %s", _superToken(pool).allowance(source, address(this)));
                        // amount is the lesser of balance and allowance
                        uint256 amount = _superToken(pool).balanceOf(source) < _superToken(pool).allowance(source, address(this)) ? _superToken(pool).balanceOf(source) : _superToken(pool).allowance(source, address(this));
                        //console.log("amount: %s", amount);
                        // transfer amount to this contract:
                        _superToken(pool).transferFrom(source, address(this), amount);
                        //console.log("source balance after transfer: %s", _superToken(pool).balanceOf(source));
                    }
                }
            } // end loop through sources
            //console.log("contract balance: %s", _superToken(pool).balanceOf(address(this)));
            // needs balance > 0
            if (_superToken(pool).balanceOf(address(this)) > 0) {
                // distribute the super token to the pool:
                int96 newFlowRate = int96(int256(_superToken(pool).balanceOf(address(this))) / streamPeriodSeconds);
                //console.log("newFlowRate: %s", uint256(uint96(newFlowRate)));
                emit StreamUpdated(gda.getFlowDistributionFlowRate(address(_superToken(pool)), address(this), address(pool)), newFlowRate);
                //console.log("before distributeFlow");
                gda.distributeFlow(
                    address(_superToken(pool)),
                    address(this),
                    address(pool),
                    newFlowRate,
                    ""
                );
            } // end if balance > 0
        } // end loop through pools
    }

    function stopFlow(ISuperFluidPool pool) external {
        // require MANAGER_ROLE
        require(hasRole(MANAGER_ROLE, msg.sender), "PoolStreamer: must have manager role to stop flow");
        _stopFlow(pool);
    }
    function _stopFlow(ISuperFluidPool pool) internal {
        // stop the flow to the pool:
        gda.distributeFlow(
            address(_superToken(pool)),
            address(this),
            address(pool),
            0,
            ""
        );
    }

    // stops the flow and distributes the remaining super token balance to the pool
    function stopFlowAndDistribute(ISuperFluidPool pool) external {
        // require MANAGER_ROLE
        require(hasRole(MANAGER_ROLE, msg.sender), "PoolStreamer: must have manager role to stop flow and distribute");
        // stop the flow
        _stopFlow(pool);
        // distribute the super token balance to the pool
        gda.distribute(
            address(_superToken(pool)),
            address(this),
            address(pool),
            _superToken(pool).balanceOf(address(this)),
            ""
        );
    }

    // withdraw function: TODO: remove before production?
    function withdrawAll(ISuperFluidPool pool) external {
        // require MANAGER_ROLE
        require(hasRole(MANAGER_ROLE, msg.sender), "PoolStreamer: must have manager role to withdraw");
        // stop the flow first because we are withdrawing all
        _stopFlow(pool);
        uint256 amount = _superToken(pool).balanceOf(address(this));
        // require amount > 0
        require(amount > 0, "PoolStreamer: amount is 0");
        // downgrade amount from super token to underlying token
        _superToken(pool).downgrade(amount);
        // transfer amount to msg.sender
        _underlyingToken(pool).transfer(msg.sender, amount);
    }

    function superToken(ISuperFluidPool pool) external view returns (address) {
        return address(_superToken(pool));
    }
    function _superToken(ISuperFluidPool pool) internal view returns (ISuperToken) {
        return ISuperToken(pool.superToken());
    }

    function underlyingToken(ISuperFluidPool pool) external view returns (address) {
        return address(_underlyingToken(pool));
    }
    function _underlyingToken(ISuperFluidPool pool) internal view returns (IERC20) {
        return IERC20(_superToken(pool).getUnderlyingToken());
    }

    function superTokenBalance(ISuperFluidPool pool) external view returns (uint256) {
        return _superToken(pool).balanceOf(address(this));
    }

    function flowRate(ISuperFluidPool pool) external view returns (int96) {
        return gda.getFlowDistributionFlowRate(address(_superToken(pool)), address(this), address(pool));
    }
    function sourceCount() external view returns (uint256) {
        return sources.length;
    }
    function poolCount() external view returns (uint256) {
        return pools.length;
    }

}
    
