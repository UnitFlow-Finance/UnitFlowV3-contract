// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

import './pool/IUnitFlowV3PoolImmutables.sol';
import './pool/IUnitFlowV3PoolState.sol';
import './pool/IUnitFlowV3PoolDerivedState.sol';
import './pool/IUnitFlowV3PoolActions.sol';
import './pool/IUnitFlowV3PoolOwnerActions.sol';
import './pool/IUnitFlowV3PoolEvents.sol';

/// @title The interface for a UnitFlow V3 Pool
/// @notice A UnitFlow pool facilitates swapping and automated market making between any two assets that strictly conform
/// to the ERC20 specification
/// @dev The pool interface is broken up into many smaller pieces
interface IUnitFlowV3Pool is
    IUnitFlowV3PoolImmutables,
    IUnitFlowV3PoolState,
    IUnitFlowV3PoolDerivedState,
    IUnitFlowV3PoolActions,
    IUnitFlowV3PoolOwnerActions,
    IUnitFlowV3PoolEvents
{

}
