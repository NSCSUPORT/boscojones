// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DarkCoin is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Dark Coin", "DC") {
        _mint(msg.sender, initialSupply);
    }

    // Função para o proprietário mintar mais tokens
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Função para queimar tokens
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
