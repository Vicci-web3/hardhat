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

    function faucet(address to, uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");
        require(to != address(0), "Invalid recipient address");
        require(amount <= 1618 * 10 ** decimals(), "Amount must be less than or equal to 1618");
        _mint(to, amount);
    }
}