/**
 * NPM Coin, based on ERC20
 *    
 *    by James W.
 *
 */
pragma solidity >=0.4.25 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract WJWNpmToken is ERC20Mintable, ERC20Pausable, ERC20Detailed, Ownable {
    constructor(string memory tname ,
    		       string memory symbol ,
		       uint8 decimals)
        ERC20Detailed(tname, symbol, decimals)
        public
    {

    }
}
