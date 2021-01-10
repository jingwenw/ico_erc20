const WJWNpmToken = artifacts.require("./WJWNpmToken.sol");
const WJWNpmTokenCrowdsale = artifacts.require("./WJWNpmTokenCrowdsale.sol");

const ether = (n) => new web3.utils.BN(web3.utils.toWei(n.toString(), 'ether'));

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};

module.exports =  function(deployer, network, accounts) {
  const _name = "WJW NPM Coin";
  const _symbol = "WNPM";
  const _decimals = 18;

//  await deployer.deploy(DappToken, _name, _symbol, _decimals);
//  const deployedToken = await DappToken.deployed();

  const latestTime = (new Date).getTime();

  const _rate           = 500;
    const _wallet       = accounts[0]; // TODO: Replace me
//  const _token          = deployedToken.address;
    const _openingTime    = latestTime + duration.weeks(1);
  const _closingTime    = _openingTime + duration.weeks(26);
  const _cap            = ether(100);
  const _goal           = ether(50);
  const _foundersFund   = accounts[1]; // TODO: Replace me
  const _foundationFund = accounts[2]; // TODO: Replace me
  const _partnersFund   = accounts[3]; // TODO: Replace me
  const _releaseTime    = _closingTime + duration.weeks(26);

    /*
  await deployer.deploy(
    DappTokenCrowdsale,
    _rate,
    _wallet,
    _token,
    _cap,
    _openingTime,
    _closingTime,
    _goal,
    _foundersFund,
    _foundationFund,
    _partnersFund,
    _releaseTime
  );
    */
    
// Deploy A, then deploy B, passing in A's newly deployed address

deployer.deploy(WJWNpmToken, _name, _symbol, _decimals).then(function() {

    return deployer.deploy(
    WJWNpmTokenCrowdsale,
    _rate,
    _wallet,
    WJWNpmToken.address,
    _cap,
    _openingTime,
    _closingTime,
    _goal,
    _foundersFund,
    _foundationFund,
    _partnersFund,
    _releaseTime
    );

});

  return true;
};
