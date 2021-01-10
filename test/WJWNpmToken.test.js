const WJWNpmToken = artifacts.require('WJWNpmToken');

require('chai')
//  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('WJWNpmToken', accounts => {
  const _name = 'Dapp Token';
  const _symbol = 'DAPP';
  const _decimals = 18;

  beforeEach(async function () {
    this.token = await WJWNpmToken.new(_name, _symbol, _decimals);
  });

  describe('token attributes', function() {
    it('has the correct name', async function() {
      const name = await this.token.name();
      name.should.equal(_name);
    });

    it('has the correct symbol', async function() {
      const symbol = await this.token.symbol();
      symbol.should.equal(_symbol);
    });

    it('has the correct decimals', async function() {
	const decimals = await this.token.decimals();
	const expected = web3.utils.toBN(_decimals);
	expect(decimals).to.eql(expected); // compare to BigNumber
	//      decimals.should.be.bignumber.equal(_decimals);
    });
  });
});
