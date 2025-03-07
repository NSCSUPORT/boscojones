// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DarkCoin is ERC20, Ownable {
    // Constructor to set the name and symbol, mint initial supply to the owner
    constructor(uint256 initialSupply) ERC20("Dark Coin", "DC") {
        _mint(msg.sender, initialSupply);
    }

    // Function to allow the owner to mint more tokens to a specific address
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Function to allow anyone to burn their own tokens
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    // Optional: Allow users to burn tokens from a specific account (if needed)
    function burnFrom(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }
}
