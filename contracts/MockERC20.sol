pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract MockERC20 is ERC20Permit, Ownable {
    constructor()
     ERC20("MockERC20", "MCK")
     ERC20Permit("MockERC20")
     Ownable(msg.sender)
      {
        _mint(msg.sender, 1618033988749894848);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}