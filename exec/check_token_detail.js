const WJWNpmToken = artifacts.require("./WJWNpmToken.sol");
const WJWNpmTokenCrowdsale = artifacts.require("./WJWNpmTokenCrowdsale.sol");

module.exports = async function(callback) {
    const npmToken = await WJWNpmToken.deployed();
    const npmTokenName = await npmToken.name();
    const npmTokenSymbol = await npmToken.symbol();
    const npmTokenDecimals = await npmToken.decimals();
    const isPaused = await npmToken.paused();
    
    console.log("  Token name: ", npmTokenName);
    console.log("  Token symbol: ", npmTokenSymbol);
    console.log("  Token decimals: ", web3.utils.toBN(npmTokenDecimals).toString());
    console.log("  Token is paused? ", isPaused);
    
    const base = web3.utils.toBN(10**18);
    const npmCrowdsale = await WJWNpmTokenCrowdsale.deployed();
    const npmRate = await npmCrowdsale.rate();
    const npmGoal = await npmCrowdsale.goal();
    const npmCap = await npmCrowdsale.cap();
    const npmWallet = await npmCrowdsale.wallet();
    const npmAddress = await npmCrowdsale.address;
    const npmOpeningTime = await npmCrowdsale.openingTime();
    const npmClosingTime = await npmCrowdsale.closingTime();
    let opt = new Date(npmOpeningTime * 1000);
    let clt = new Date(npmClosingTime * 1000);
    let isOpen = await npmCrowdsale.isOpen();

    console.log("  Crowdsale initial rate: ", web3.utils.toBN(npmRate).toString());  
    console.log("  Crowdsale goal (unit: eth): ", web3.utils.toBN(npmGoal).div(base).toString());  
    console.log("  Crowdsale cap (unit: eth): ", web3.utils.toBN(npmCap).div(base).toString());
    console.log("  Crowdsale wallet: ", npmWallet);
    console.log("  Crowdsale address: ", npmAddress);
    console.log("  Crowdsale opening time: " + opt.toUTCString() + " ", npmOpeningTime);
    console.log("  Crowdsale closing time: " + clt.toUTCString() + " ", npmClosingTime);
    console.log("  Crowdsale is open? ", isOpen);

    if (isOpen && isPaused) {
	console.log("  Crowdsale has started ...");

	let raised = await npmCrowdsale.weiRaised();
	let eth = raised / 10 ** 18;
	console.log("     So far wei raised: " + raised + " Or eth: " + eth);
    } 
    
    console.log("========== Done Checking ========");
    return true;
}
