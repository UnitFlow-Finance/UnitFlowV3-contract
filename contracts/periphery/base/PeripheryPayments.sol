// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.7.5;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '../interfaces/IPeripheryPayments.sol';

import '../libraries/TransferHelper.sol';

import './PeripheryImmutableState.sol';

abstract contract PeripheryPayments is IPeripheryPayments, PeripheryImmutableState {
    // Set to msg.sender at the start of every top-level entry point (swap, mint,
    // collect, etc.) and cleared on exit.  Sweep/refund helpers check this so
    // they can only be called by the address that opened the current operation,
    // preventing third-party drains of tokens left in the contract.
    address internal _callerLock;

    modifier onlyCaller() {
        require(msg.sender == _callerLock, 'Not caller');
        _;
    }

    // Sets _callerLock to msg.sender for the duration of the decorated function.
    modifier lockCaller() {
        _callerLock = msg.sender;
        _;
        _callerLock = address(0);
    }

    /// @inheritdoc IPeripheryPayments
    function refund(
        address token,
        uint256 amountMinimum,
        address recipient
    ) public payable override onlyCaller {
        uint256 balanceToken = token == address(0) ? address(this).balance : IERC20(token).balanceOf(address(this));
        require(balanceToken >= amountMinimum, 'Insufficient token');

        if (balanceToken > 0) {
            if (token == address(0)) {
                TransferHelper.safeTransferUSDC(recipient, balanceToken);
            } else {
                TransferHelper.safeTransfer(token, recipient, balanceToken);
            }
        }
    }

    /// @inheritdoc IPeripheryPayments
    function sweepToken(
        address token,
        uint256 amountMinimum,
        address recipient
    ) public payable override onlyCaller {
        uint256 balanceToken = token == address(0) ? address(this).balance : IERC20(token).balanceOf(address(this));
        require(balanceToken >= amountMinimum, 'Insufficient token');

        if (balanceToken > 0) {
            if (token == address(0)) {
                TransferHelper.safeTransferUSDC(recipient, balanceToken);
            } else {
                TransferHelper.safeTransfer(token, recipient, balanceToken);
            }
        }
    }

    /// @param token The token to pay
    /// @param payer The entity that must pay
    /// @param recipient The entity that will receive payment
    /// @param value The amount to pay
    function pay(
        address token,
        address payer,
        address recipient,
        uint256 value
    ) internal {
        if (payer == address(this)) {
            // pay with tokens already in the contract
            TransferHelper.safeTransfer(token, recipient, value);
        } else {
            // pull payment
            TransferHelper.safeTransferFrom(token, payer, recipient, value);
        }
    }
}
