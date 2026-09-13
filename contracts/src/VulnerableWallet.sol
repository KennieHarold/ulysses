// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableWallet {
    address public owner;
    mapping(address => uint256) public deposits;

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        deposits[msg.sender] += msg.value;
    }

    function setOwner(address newOwner) external {
        owner = newOwner;
    }

    function withdrawAll() external {
        require(msg.sender == owner, "not owner");
        (bool ok, ) = msg.sender.call{value: address(this).balance}("");
        require(ok, "send failed");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
