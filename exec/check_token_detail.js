const WJWNpmToken = artifacts.require("./WJWNpmToken.sol");
const WJWNpmTokenCrowdsale = artifacts.require("./WJWNpmTokenCrowdsale.sol");

module.exports = async function(callback) {
    const npmToken = await WJWNpmToken.deployed();
    const npmTokenName = await npmToken.name();
    const npmTokenSymbol = await npmToken.symbol();
    const npmTokenDecimals = await npmToken.decimals();
    console.log("Token name: ", npmTokenName);
    console.log("Token symbol: ", npmTokenSymbol);
    console.log("Token decimals: ", web3.utils.toBN(npmTokenDecimals).toString());

    const base = web3.utils.toBN(10**18);
    const npmCrowdsale = await WJWNpmTokenCrowdsale.deployed();
    const npmRate = await npmCrowdsale.rate();
    const npmGoal = await npmCrowdsale.goal();
    const npmCap = await npmCrowdsale.cap();
    const npmWallet = await npmCrowdsale.wallet();
    
    console.log("Crowdsale initial rate: ", web3.utils.toBN(npmRate).toString());  
    console.log("Crowdsale goal (unit: eth): ", web3.utils.toBN(npmGoal).div(base).toString());  
    console.log("Crowdsale cap (unit: eth): ", web3.utils.toBN(npmCap).div(base).toString());
    console.log("Crowsale wallet: ", npmWallet);

}
