# NPM Coin ICO based on openzepplin 2.5.1

Features:
   1. ERC20 ICO crowdsale based on openzepplin 2.5.1 crowdsale and truffle
   2. Staged (preICO and ICO), Refunable, Timed crowdsale
   3. The rate would be half in the ICO stage of the one during preICO.
   
Prequisite:
   1. nodejs installed
   2. truffle framework installed (sudo npm install truffle)
   3. ganache-cli installed (sudo npm install -g ganache-cli, and will
   copy the MNEMONIC text into .env as the sample for public test network) 
   4. (optional) signup on infura.io and get api key (will be put your .env file) for
   public test network.

Local Build/Migrate/Test Setup:
   1. git clone this repos
   2. goto the dir cloned
   3. truffle init - then delete truffle-config.js, using truffle.js instead
   4. npm install (might need to be followed by npm audit fix)

   Now the private ganache network environment is ready.

   (Optional) For public test network, kovan or ropsten, please do the followings:
   - copy .env_sample to .env and update it with your infura_api_key and your
   wallet MNEMONIC string
   - under migratiion/, cp 3_deploy_crowdsale.js.kovan.network to 3_deploy_crowdsale.js

Testing steps for the private network:
   1. start ganache-cli from different shell window

   From the dir root of the repos:
   2. truffle compile
   3. truffle migrate 
   4. truffle test

Known Issues:

   n/a