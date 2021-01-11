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

  let latestTime = (new Date).getTime();
  latestTime = Math.round(latestTime / 1000); // in seconds
  const _rate           = 500;
  const _wallet         = "0x0A6b91809587D581860e22153Ff2871f99E4F4fe"; // TODO: Replace me
  const _openingTime    = latestTime + duration.minutes(10);
  const _closingTime    = _openingTime + duration.weeks(26);
  const _cap            = ether(100);
  const _goal           = ether(50);
  const _foundersFund   = "0xCFfa4620ff70b641b18a89526D1149b0371C0757"; // TODO: Replace me
  const _foundationFund = "0xb0F7BB89a2f7DcE2b5F5A2225b0bEdB396d4cA19"; // TODO: Replace me
  const _partnersFund   = "0x3aE6541Ce46E05b386Bd7c98B4a938a4A5865665"; // TODO: Replace me
  const _releaseTime    = _closingTime + duration.weeks(26);

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
