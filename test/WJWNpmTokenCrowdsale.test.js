import ether from './helpers/ether';
import EVMRevert from './helpers/EVMRevert';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

require('chai')
  .use(require('chai-as-promised'))
  .should();

const WJWNpmToken = artifacts.require('WJWNpmToken');
const WJWNpmTokenCrowdsale = artifacts.require('WJWNpmTokenCrowdsale');

//const RefundVault = artifacts.require('./RefundVault');
const TokenTimelock = artifacts.require('./TokenTimelock');

contract('WJWNpmTokenCrowdsale', function([_, wallet, investor1, investor2, foundersFund, foundationFund, partnersFund]) {


  before(async function() {
    // Transfer extra ether to investor1's account for testing
    await web3.eth.sendTransaction({ from: _, to: investor1, value: ether(25) })
  });
    
    
  beforeEach(async function () {
    // Token config
    this.name = "WJWNpmToken";
    this.symbol = "DAPP";
    this.decimals = 18;

    // Deploy Token
    this.token = await WJWNpmToken.new(
      this.name,
      this.symbol,
      this.decimals
    );

    // Crowdsale config
    this.rate = 500;
    this.wallet = wallet;
      this.cap = ether(100);
      this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.goal = ether(50);
    this.foundersFund = foundersFund;
    this.foundationFund = foundationFund;
    this.partnersFund = partnersFund;
    this.releaseTime  = this.closingTime + duration.years(1);

    // Investor caps
    this.investorMinCap = ether(0.002);
    this.inestorHardCap = ether(50);

    // ICO Stages
    this.preIcoStage = 0;
    this.preIcoRate = 500;
    this.icoStage = 1;
    this.icoRate = 250;

    // Token Distribution
    this.tokenSalePercentage  = 20;
    this.foundersPercentage   = 60;
    this.foundationPercentage = 10;
    this.partnersPercentage   = 10;

    this.crowdsale = await WJWNpmTokenCrowdsale.new(
      this.rate,
      this.wallet,
      this.token.address,
      this.cap,
      this.openingTime,
      this.closingTime,
      this.goal,
      this.foundersFund,
      this.foundationFund,
      this.partnersFund,
      this.releaseTime
    );

    // Pause Token
    await this.token.pause();

    // Transfer token ownership to crowdsale
    await this.token.transferOwnership(this.crowdsale.address);

      // have to add Minter Role to mint, pauser role to pause/unpause
    await this.token.addMinter(this.crowdsale.address, { from: _ });
    await this.token.renounceMinter({ from: _ });  
      
    await this.token.addPauser(this.crowdsale.address, { from: _ });
  //  await this.token.renouncePauser({ from: _ });  
      
    // Add investors to whitelist
  //  await this.crowdsale.addManyToWhitelist([investor1, investor2]);

    // Advance time to crowdsale start
      await increaseTimeTo(this.openingTime + 1);
//      console.log("  beforeEach top with crowdsale addr: " + this.crowdsale.address);
  });

  describe('crowdsale', function() {	
    it('tracks the rate', async function() {
	const rate = await this.crowdsale.rate();
	const expected = web3.utils.toBN(this.rate); 
	expect(rate).to.eql(expected);
    });

   
    it('tracks the wallet', async function() {
	const wallet1 = await this.crowdsale.wallet();
	expect(wallet1).to.be.equal(this.wallet);
    });

    it('tracks the token address', async function() {
      const token = await this.crowdsale.token();
      token.should.equal(this.token.address);
    });

    it('tracks the token status', async function() {
        const paused = await this.token.paused();
        paused.should.be.true;
    });
  });

  describe('minted crowdsale', function() {
    it('is open', async function() {
      const isOpen = await this.crowdsale.isOpen();
      isOpen.should.be.true;
    });

    it('crowdsale should be minter', async function () {
	expect(await this.token.isMinter(this.crowdsale.address)).to.equal(true);
    });
      
    it('mints tokens after purchase', async function() {
      const originalTotalSupply = await this.token.totalSupply();
      await this.crowdsale.sendTransaction({ value: ether(1), from: investor1 });
      const newTotalSupply = await this.token.totalSupply();
      assert.isTrue(newTotalSupply > originalTotalSupply);
    });
  });

  describe('capped crowdsale', async function() {
    it('has the correct hard cap', async function() {
	const cap = await this.crowdsale.cap();
	//const expected = web3.utils.toBN(this.cap); already a BN
	expect(cap.toString()).to.be.equal(this.cap.toString());
    });
  });

  describe('timed crowdsale', function() {
    it('has not closed', async function() {
      const isClosed = await this.crowdsale.hasClosed();
      isClosed.should.be.false;
    });
  });

    /*
  describe('whitelisted crowdsale', function() {
    it('rejects contributions from non-whitelisted investors', async function() {
      const notWhitelisted = _;
      await this.crowdsale.buyTokens(notWhitelisted, { value: ether(1), from: notWhitelisted }).should.be.rejectedWith(EVMRevert);
    });
  });
    */

    // no vault function found, so comment it out for now 
  describe('refundable crowdsale', function() {
    beforeEach(async function() {
      await this.crowdsale.buyTokens(investor1, { value: ether(1), from: investor1 });
    });

    describe('during crowdsale', function() {
      it('prevents the investor from claiming refund', async function() {
         await this.crowdsale.claimRefund(investor1, { from: investor1 }).should.be.rejectedWith(EVMRevert);
      });

      it('withdrawing tokens is not allowed - the tokens only avaialble after ico', async function() {
         await this.crowdsale.withdrawTokens(investor1).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('when the corwdsale stage is PreICO', function() {
      beforeEach(async function () {
	    this.walletBalance = await web3.eth.getBalance(this.wallet);
        // Crowdsale stage is already PreICO by default
        await this.crowdsale.buyTokens(investor1, { value: ether(1), from: investor1 });
      });

      it('forwards funds to the wallet', async function () {
          const balance = await web3.eth.getBalance(this.wallet);
	 // console.log("balance: " + balance);
	  const bn = web3.utils.toBN(balance);
          expect(bn.gt(web3.utils.toBN(this.walletBalance))).to.be.true;
      });
    });

    describe('when the crowdsale stage is ICO', function() {
	beforeEach(async function () {
	    this.walletBalance = await web3.eth.getBalance(this.wallet);
	    this.weiRaised = await this.crowdsale.weiRaised();
//	    console.log("walletBalance at beginning: " + this.walletBalance + "; weiRaised: " + this.weiRaised);
            await this.crowdsale.setCrowdsaleStage(this.icoStage, { from: _ });
        await this.crowdsale.buyTokens(investor1, { value: ether(1), from: investor1 });
      });

      it('wei raised after buy', async function () {
          const wei = await this.crowdsale.weiRaised();
          expect(wei > this.weiRaised).to.be.true;
      });

      it('forwards funds to the refund vault, NOT to the wallet', async function () {
          const balance = await web3.eth.getBalance(this.wallet);
	 // console.log(" wallet balance after buy during ICO: " + balance);
	  const bn = web3.utils.toBN(balance.toString());
          expect(balance).to.be.equals(this.walletBalance);
      });

    });
  });
    
    
  describe('crowdsale stages', function() {

    it('it starts in PreICO', async function () {
      const stage = await this.crowdsale.stage();
	const expected = web3.utils.toBN(this.preIcoStage);
	expect(stage).to.eql(expected);
    });

    it('starts at the preICO rate', async function () {
      const rate = await this.crowdsale.rate();
	const expected = web3.utils.toBN(this.preIcoRate);
	expect(rate).to.eql(expected);
    });

    it('allows admin to update the stage & rate', async function() {
      await this.crowdsale.setCrowdsaleStage(this.icoStage, { from: _ });
      const stage = await this.crowdsale.stage();
      const expected = web3.utils.toBN(this.icoStage);
	expect(stage).to.eql(expected);
	const rate = await this.crowdsale.rate();
	const expected1 = web3.utils.toBN(this.icoRate);
	expect(rate).to.eql(expected1);
    });

    it('prevents non-admin from updating the stage', async function () {
      await this.crowdsale.setCrowdsaleStage(this.icoStage, { from: investor1 }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('accepting payments', function() {
    it('should accept payments', async function() {
      const value = ether(1);
      const purchaser = investor2;
      await this.crowdsale.sendTransaction({ value: value, from: investor1 }).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor1, { value: value, from: purchaser }).should.be.fulfilled;
    });
  });

  describe('buyTokens()', function() {
    describe('when the contribution is less than the minimum cap', function() {
      it('rejects the transaction', async function() {
        const value = this.investorMinCap - 1;
        await this.crowdsale.buyTokens(investor2, { value: value, from: investor2 }).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('when the investor has already met the minimum cap', function() {
      it('allows the investor to contribute below the minimum cap', async function() {
        // First contribution is valid
        const value1 = ether(1);
        await this.crowdsale.buyTokens(investor1, { value: value1, from: investor1 });
        // Second contribution is less than investor cap
        const value2 = 1; // wei
        await this.crowdsale.buyTokens(investor1, { value: value2, from: investor1 }).should.be.fulfilled;
      });
    });
  });

  describe('when the total contributions exceed the investor hard cap', function () {
    it('rejects the transaction', async function () {
      // First contribution is in valid range
      const value1 = ether(2);
      await this.crowdsale.buyTokens(investor1, { value: value1, from: investor1 });
      // Second contribution sends total contributions over investor hard cap
      const value2 = ether(49);
      await this.crowdsale.buyTokens(investor1, { value: value2, from: investor1 }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('when the contribution is within the valid range', function () {
    const value = ether(2);
    it('succeeds & updates the contribution amount', async function () {
      await this.crowdsale.buyTokens(investor2, { value: value, from: investor2 }).should.be.fulfilled;
      const contribution = await this.crowdsale.getUserContribution(investor2);
//	const expected = web3.utils.toBN(value);
	expect(contribution.toString()).to.eql(value.toString());

    });
  });

  describe('token transfers', function () {
    it('does not allow investors to transfer tokens during crowdsale', async function () {
      // Buy some tokens first
      await this.crowdsale.buyTokens(investor1, { value: ether(1), from: investor1 });
      // Attempt to transfer tokens during crowdsale
      await this.token.transfer(investor2, 1, { from: investor1 }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('finalizing the crowdsale', function() {
    describe('when the goal is not reached', function() {
      beforeEach(async function () {
        // Do not meet the goal
        await this.crowdsale.buyTokens(investor2, { value: ether(1), from: investor2 });
        // Fastforward past end time
        await increaseTimeTo(this.closingTime + 1);
        // Finalize the crowdsale
        await this.crowdsale.finalize({ from: _ });
      });

	
      it('allows the investor to claim refund', async function () {
        await this.crowdsale.claimRefund(investor2, { from: investor2 }).should.be.fulfilled;
      });

    });

    describe('when the goal is reached', function() {
      beforeEach(async function () {
        // track current wallet balance
        this.walletBalance = await web3.eth.getBalance(wallet);
	console.log("  walletBalance: " + this.walletBalance);
	const ib = await this.token.balanceOf(investor1);
	console.log("  investor1 token balance: " + ib + " @ " + investor1);

	  // Meet the goal
        await this.crowdsale.buyTokens(investor1, { value: ether(26), from: investor1 });
        await this.crowdsale.buyTokens(investor2, { value: ether(26), from: investor2 });

          // Fastforward past end time
	await increaseTimeTo(this.closingTime + 1);

        // Finalize the crowdsale
        await this.crowdsale.finalize({ from: _ });
      });

      it('handles goal reached', async function () {
          // Tracks goal reached
	console.log("      - track goal should be reached");
        const goalReached = await this.crowdsale.goalReached();
        goalReached.should.be.true;

        // Finishes minting token - not mintable once final
	console.log("      - purchase via crowdsale should be rejected once it is finalized");
        await this.crowdsale.buyTokens(investor2, { value: ether(2), from: investor2 }).should.be.rejectedWith(EVMRevert);

        console.log("      - withdrawing tokens is not allowed as it is already done in finalization");
        await this.crowdsale.withdrawTokens(investor1).should.be.rejectedWith(EVMRevert);
      
        console.log("      - Transfers ownership to the wallet");
        const owner = await this.token.owner();
        owner.should.equal(this.wallet);
	  
        console.log("      - Prevents investor from claiming refund");
        await this.crowdsale.claimRefund(investor1, { from: investor1 }).should.be.rejectedWith(EVMRevert);

        console.log("      - the token should be unpaused after ico");
        const paused = await this.token.paused();
        paused.should.be.false;

	  
        let totalSupply = await this.token.totalSupply();
	let totalSupplyBN = web3.utils.toBN(totalSupply);
	let base = web3.utils.toBN(10 ** this.decimals);
	let bn100 = web3.utils.toBN(100);

        console.log("      - check investors´ tokens (should be available after ico");
	let tb1 = await this.token.balanceOf(investor1);
	tb1 = web3.utils.toBN(tb1);
	let exp = web3.utils.toBN(26).mul(web3.utils.toBN(this.rate)).mul(base);
//	  expect(tb1).to.eql(exp);
	expect(tb1.eq(exp)).to.be.true;
	  
        console.log("      - token transfer should be allowed");
	  let tbn = 3;
        await this.token.transfer(investor2, tbn, { from: investor1 }).should.be.fulfilled;

        console.log("      - check investor1 token balance after token transfers");
	let tbNew = await this.token.balanceOf(investor1);
        tbNew = web3.utils.toBN(tbNew);
        expect(tbNew.eq(exp.addn(-1 * tbn))).to.be.true;
	  
          console.log("      - check investor2 token balance after token transfers");
	let tbNew2 = await this.token.balanceOf(investor2);
        tbNew2 = web3.utils.toBN(tbNew2);
          expect(tbNew2).to.eql(exp.addn(tbn));
	  
          // Founders
        const foundersTimelockAddress = await this.crowdsale.foundersTimelock();
        let foundersTimelockBalance = await this.token.balanceOf(foundersTimelockAddress);
          foundersTimelockBalance = web3.utils.toBN(foundersTimelockBalance).div(base);
        let foundersAmount = totalSupplyBN.mul(web3.utils.toBN(this.foundersPercentage)).div(bn100).div(base);
	  console.log("      - checking founders token amount locked");
          expect(foundersTimelockBalance).to.eql(foundersAmount);

	// Foundation
        const foundationTimelockAddress = await this.crowdsale.foundationTimelock();
        let foundationTimelockBalance = await this.token.balanceOf(foundationTimelockAddress);
          foundationTimelockBalance = web3.utils.toBN(foundationTimelockBalance).div(base);
        let foundationAmount = totalSupplyBN.mul(web3.utils.toBN(this.foundationPercentage)).div(bn100).div(base);
	  console.log("      - checking foundation token amount locked");
	  expect(foundationTimelockBalance).to.eql(foundationAmount);

        // Partners
        const partnersTimelockAddress = await this.crowdsale.partnersTimelock();
        let partnersTimelockBalance = await this.token.balanceOf(partnersTimelockAddress);
          partnersTimelockBalance = web3.utils.toBN(partnersTimelockBalance).div(base);
	let partnersAmount = totalSupplyBN.mul(web3.utils.toBN(this.partnersPercentage)).div(bn100).div(base);
	  console.log("      - checking partners token amount locked");
          assert.equal(partnersTimelockBalance.toString(), partnersAmount.toString());

          console.log("      - Can't withdraw from timelocks before release time");
        const foundersTimelock = await TokenTimelock.at(foundersTimelockAddress);
        await foundersTimelock.release().should.be.rejectedWith(EVMRevert);

        const foundationTimelock = await TokenTimelock.at(foundationTimelockAddress);
        await foundationTimelock.release().should.be.rejectedWith(EVMRevert);

        const partnersTimelock = await TokenTimelock.at(partnersTimelockAddress);
        await partnersTimelock.release().should.be.rejectedWith(EVMRevert);

          console.log("      - Can withdraw from timelocks after release time");
        await increaseTimeTo(this.releaseTime + 1);

        await foundersTimelock.release().should.be.fulfilled;
        await foundationTimelock.release().should.be.fulfilled;
        await partnersTimelock.release().should.be.fulfilled;

        // Funds now have balances

        // Founders
        let foundersBalance = await this.token.balanceOf(this.foundersFund);
          foundersBalance = web3.utils.toBN(foundersBalance).div(base)
	  console.log("      - checking founders token amount unlocked expect: " + foundersAmount);
          expect(foundersBalance).to.eql(foundersAmount);

        // Foundation
        let foundationBalance = await this.token.balanceOf(this.foundationFund);
          foundationBalance = web3.utils.toBN(foundationBalance).div(base);
	  console.log("      - checking foundation token amount unlocked");
          expect(foundationBalance).to.eql(foundationAmount);

        // Partners
        let partnersBalance = await this.token.balanceOf(this.partnersFund);
          partnersBalance = web3.utils.toBN(partnersBalance).div(base);
	  console.log("      - checking partners token amount unlocked");
          expect(partnersBalance).to.eql(partnersAmount);

        console.log("      - Enables token transfers between founders and foundation");
        await this.token.transfer(this.foundationFund, 2, {from: this.foundersFund}).should.be.fulfilled;

        console.log("      - checking founders tokens after transfer");
        let foundersBalanceNew = await this.token.balanceOf(this.foundersFund);
          foundersBalanceNew = web3.utils.toBN(foundersBalanceNew);
          expect(foundersBalanceNew).to.eql(foundersAmount.mul(base).addn(-2));

        console.log("      - checking foundation tokens after transfer");
        let foundationBalanceNew = await this.token.balanceOf(this.foundationFund);
          foundationBalanceNew = web3.utils.toBN(foundationBalanceNew);
          expect(foundationBalanceNew).to.eql(foundationAmount.mul(base).addn(2));

      });

    });
  });

  describe('token distribution', function() {
    it('tracks token distribution correctly', async function () {
      const tokenSalePercentage = await this.crowdsale.tokenSalePercentage();
	const expected = web3.utils.toBN(this.tokenSalePercentage, 'has correct tokenSalePercentage');
	expect(tokenSalePercentage).to.eql(expected);

      const foundersPercentage = await this.crowdsale.foundersPercentage();
	const expected1 = web3.utils.toBN(this.foundersPercentage, 'has correct foundersPercentage');
        expect(foundersPercentage).to.eql(expected1);

      const foundationPercentage = await this.crowdsale.foundationPercentage();
	const expected2 = web3.utils.toBN(this.foundationPercentage, 'has correct foundationPercentage');
        expect(foundationPercentage).to.eql(expected2);

      const partnersPercentage = await this.crowdsale.partnersPercentage();
	const expected3 = web3.utils.toBN(this.partnersPercentage, 'has correct partnerssPercentage');
        expect(partnersPercentage).to.eql(expected3);

    });

    it('is a valid percentage breakdown', async function () {
      const tokenSalePercentage = await this.crowdsale.tokenSalePercentage();
      const foundersPercentage = await this.crowdsale.foundersPercentage();
      const foundationPercentage = await this.crowdsale.foundationPercentage();
      const partnersPercentage = await this.crowdsale.partnersPercentage();

      const total = tokenSalePercentage.toNumber() + foundersPercentage.toNumber() + foundationPercentage.toNumber() + partnersPercentage.toNumber()
      total.should.equal(100);
    });
      
  });
});

