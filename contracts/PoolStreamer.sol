// SPDX-License-Identifier: CC0-1.0
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface ISuperFluidPool {
    function getUnits(address memberAddr) external view returns (uint128);
    function updateMemberUnits(address memberAddr, uint128 newUnits) external returns (bool);
    function superToken() external view returns (address);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface ISuperToken {
    function upgrade(uint256 amount) external;
    function downgrade(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function getUnderlyingToken() external view returns (address tokenAddr);
}

interface IGeneralDistributionAgreementV1 {
    function getFlowRate(address tokenAddress, address from, address to) external view returns (int96);
    function distributeFlow(address superTokenAddress, address from, address poolAddress, int96 requestedFlowRate, bytes calldata ctx) external returns (bytes memory newCtx);
}

contract PoolStreamer is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    ISuperFluidPool public pool;
    IGeneralDistributionAgreementV1 public gda;
    address[] public sources;
    int96 public streamPeriodSeconds;

    event SourceAdded(address source);
    event SourceRemoved(address source);

    event StreamUpdated(int96 oldFlowRate, int96 newFlowRate);

    constructor(IGeneralDistributionAgreementV1 _gda, ISuperFluidPool _pool, int96 _streamPeriodSeconds) {
        gda = _gda;
        pool = _pool;
        streamPeriodSeconds = _streamPeriodSeconds;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    function setPool(ISuperFluidPool _pool) external {
        require(hasRole(MANAGER_ROLE, msg.sender), "PoolStreamer: must have manager role to set pool");
        pool = _pool;
    }

    function registerSource(address source) external {
        // require underlying balance > 0
        require(_underlyingToken().balanceOf(source) > 0, "PoolStreamer: source balance is 0");
        // require allowance > 0
        require(_underlyingToken().allowance(source, address(this)) > 0, "PoolStreamer: source allowance is 0");
        // require source is not already registered
        for (uint256 i = 0; i < sources.length; i++) {
            require(sources[i] != source, "PoolStreamer: source already registered");
        }
        // require max sources is 20
        require(sources.length < 20, "PoolStreamer: max sources reached");
        sources.push(source);
        emit SourceAdded(source);
    }

    function removeSource(address source) external {
        // require MANAGER_ROLE
        require(hasRole(MANAGER_ROLE, msg.sender), "PoolStreamer: must have manager role to remove source");
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
        // loop through each source:
        for (uint256 i = 0; i < sources.length; i++) {
            address source = sources[i];
            // check if source has a positive balance
            if (_underlyingToken().balanceOf(source) > 0) {
                // check if source has a positive allowance
                if (_underlyingToken().allowance(source, address(this)) > 0) {
                    // amount is the lesser of balance and allowance
                    uint256 amount = _underlyingToken().balanceOf(source) < _underlyingToken().allowance(source, address(this)) ? _underlyingToken().balanceOf(source) : _underlyingToken().allowance(source, address(this));
                    // transfer amount to this contract:
                    _underlyingToken().transferFrom(source, address(this), amount);
                }
            }
        }
        // require underlying balance > 0
        require(_underlyingToken().balanceOf(address(this)) > 0, "PoolStreamer: contract balance is 0");
        // upgrade the underlying balance to super token:
        _superToken().upgrade(_underlyingToken().balanceOf(address(this)));
        // distribute the super token to the pool:
        int96 newFlowRate = int96(int256(_superToken().balanceOf(address(this))) / streamPeriodSeconds);
        emit StreamUpdated(gda.getFlowRate(address(_superToken()), address(this), address(pool)), newFlowRate);
        gda.distributeFlow(
            address(_superToken()),
            address(this),
            address(pool),
            newFlowRate,
            ""
        );
    }

    function superToken() external view returns (address) {
        return address(_superToken());
    }
    function _superToken() internal view returns (ISuperToken) {
        return ISuperToken(pool.superToken());
    }

    function underlyingToken() external view returns (address) {
        return address(_underlyingToken());
    }
    function _underlyingToken() internal view returns (IERC20) {
        return IERC20(_superToken().getUnderlyingToken());
    }

    function flowRate() external view returns (int96) {
        return gda.getFlowRate(address(_superToken()), address(this), address(pool));
    }
    function sourceCount() external view returns (uint256) {
        return sources.length;
    }

    

}
    