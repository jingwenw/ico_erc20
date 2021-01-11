pragma solidity >=0.4.25 <0.9.0;

import "./WJWNpmToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/TokenTimelock.sol";
import "@openzeppelin/contracts/crowdsale/Crowdsale.sol";
import "@openzeppelin/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "@openzeppelin/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "@openzeppelin/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "@openzeppelin/contracts/crowdsale/validation/WhitelistCrowdsale.sol";
import "@openzeppelin/contracts/crowdsale/distribution/RefundablePostDeliveryCrowdsale.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract WJWNpmTokenCrowdsale is Crowdsale, MintedCrowdsale, CappedCrowdsale, TimedCrowdsale, RefundablePostDeliveryCrowdsale,Ownable {

  // Track investor contributions
  uint256 public investorMinCap = 2000000000000000; // 0.002 ether
  uint256 public investorHardCap = 50000000000000000000; // 50 ether
  mapping(address => uint256) private contributions;
  address [] private contributors;

  // Crowdsale Stages
  enum CrowdsaleStage { PreICO, ICO }
  // Default to presale stage
  CrowdsaleStage public stage = CrowdsaleStage.PreICO;

  // Token Distribution
  uint256 public tokenSalePercentage   = 20;
  uint256 public foundersPercentage    = 60;
  uint256 public foundationPercentage  = 10;
  uint256 public partnersPercentage    = 10;

  // Token reserve funds
  address public foundersFund;
  address public foundationFund;
  address public partnersFund;

  // Token time lock
  uint256 public releaseTime;
  TokenTimelock public foundersTimelock;
  TokenTimelock public foundationTimelock;
  TokenTimelock public partnersTimelock;

  WJWNpmToken private myToken;
  uint256 private myRatePreICO;
  uint256 private myRateICO;
  
  constructor(
    uint256 _rate,
    address payable _wallet,
    WJWNpmToken _token,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _goal,
    address _foundersFund,
    address _foundationFund,
    address _partnersFund,
    uint256 _releaseTime
  )
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
    RefundableCrowdsale(_goal)
    public
  {
    require(_goal <= _cap);
    foundersFund   = _foundersFund;
    foundationFund = _foundationFund;
    partnersFund   = _partnersFund;
    releaseTime    = _releaseTime;

    myToken        = _token;
    myRatePreICO   = _rate;
    myRateICO	   = _rate / 2;
  }

  /**
  * @dev Returns the amount contributed so far by a sepecific user.
  * @param _beneficiary Address of contributor
  * @return User contribution so far
  */
  function getUserContribution(address _beneficiary)
    public view returns (uint256)
  {
    return contributions[_beneficiary];
  }

  /**
  * @dev Allows admin to update the crowdsale stage
  * @param _stage Crowdsale stage
  */
  function setCrowdsaleStage(uint _stage) public onlyOwner {
    if(uint(CrowdsaleStage.PreICO) == _stage) {
      stage = CrowdsaleStage.PreICO;
    } else if (uint(CrowdsaleStage.ICO) == _stage) {
      stage = CrowdsaleStage.ICO;
    }
  }

  function rate() public view returns (uint256) {
     uint256 myRate = myRateICO;
     if(CrowdsaleStage.PreICO == stage) {
     	      myRate = myRatePreICO;
     } else if (CrowdsaleStage.ICO == stage) {
     	      myRate = myRateICO;
      }
      return myRate;
   }
  
    function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
	return weiAmount.mul(rate());
    }

  /**
   * @dev forwards funds to the wallet during the PreICO stage, then the refund vault during ICO stage
   */
  function _forwardFunds() internal {
    if(stage == CrowdsaleStage.PreICO) {
      wallet().transfer(msg.value);
    } else if (stage == CrowdsaleStage.ICO) {
      super._forwardFunds();
    }
  }

  /**
  * @dev Extend parent behavior requiring purchase to respect investor min/max funding cap.
  * @param _beneficiary Token purchaser
  * @param _weiAmount Amount of wei contributed
  */
  function _preValidatePurchase(
    address _beneficiary,
    uint256 _weiAmount
  )
    internal view
  {
    super._preValidatePurchase(_beneficiary, _weiAmount);
    uint256 _existingContribution = contributions[_beneficiary];
    uint256 _newContribution = _existingContribution.add(_weiAmount);
    require(_newContribution >= investorMinCap && _newContribution <= investorHardCap);
//    contributions[_beneficiary] = _newContribution;
  }

  function _updatePurchasingState(address _beneficiary,
  	   uint256 _weiAmount) internal {
    uint256 _existingContribution = contributions[_beneficiary];
    uint256 _newContribution = _existingContribution.add(_weiAmount);
    contributions[_beneficiary] = _newContribution;
    contributors.push(_beneficiary);
    super._updatePurchasingState(_beneficiary, _weiAmount);
  }

  /**
   * @dev enables token transfers, called when owner calls finalize()
  */
  function _finalization() internal {
    if(goalReached()) {
      ERC20Mintable _mintableToken = myToken; // ERC20Mintable(token);
      uint256 _alreadyMinted = _mintableToken.totalSupply();

      uint256 _finalTotalSupply = _alreadyMinted.div(tokenSalePercentage).mul(100);

      foundersTimelock   = new TokenTimelock(myToken, foundersFund, releaseTime);
      foundationTimelock = new TokenTimelock(myToken, foundationFund, releaseTime);
      partnersTimelock   = new TokenTimelock(myToken, partnersFund, releaseTime);

      _mintableToken.mint(address(foundersTimelock),   _finalTotalSupply.mul(foundersPercentage).div(100));
      _mintableToken.mint(address(foundationTimelock), _finalTotalSupply.mul(foundationPercentage).div(100));
      _mintableToken.mint(address(partnersTimelock),   _finalTotalSupply.mul(partnersPercentage).div(100));

//   _mintableToken.finishMinting(); - mint automatically finished after final
      // Unpause the token
//      ERC20Pausable _pausableToken = myToken;// ERC20Pausable(token);
      myToken.unpause();
      myToken.transferOwnership(wallet());

      // Now need to call withdrawToken() for each buyer to distribute tokens
      //     from the token vault -- Added by James
       for (uint i = 0; i < contributors.length; i++) {
       	   if (contributions[contributors[i]] > 0) {
       	      withdrawTokens(contributors[i]);
	   }
       }

    }

    super._finalization();
  }

}
