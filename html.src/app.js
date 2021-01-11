App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  contractInstance: null,

  init: async () => {
    await App.initWeb3()
    await App.initContracts()
    await App.render()
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  initWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider)
    } else {
      window.alert("Please connect to Metamask.")
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        await ethereum.enable()
        // Acccounts now exposed
        web3.eth.sendTransaction({/* ... */})
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = web3.currentProvider
      window.web3 = new Web3(web3.currentProvider)
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */})
    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  },

  initContracts: async () => {
    const contract = await $.getJSON('WJWNpmTokenCrowdsale.json')
    App.contracts.MyContract = TruffleContract(contract)
    App.contracts.MyContract.setProvider(App.web3Provider)
  },

  render: async () => {
    // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(true)

    // Set the current blockchain account
    App.account = web3.eth.accounts[0]
    $('#account').html(App.account)

    // Load smart contract
    const contract = await App.contracts.MyContract.deployed()
    App.contractInstance = contract

      const rate = await App.contractInstance.rate();
      const addr = await App.contractInstance.address;
      const token = await App.contractInstance.token();
      const isOpen = await App.contractInstance.isOpen();
      let openingTime = await App.contractInstance.openingTime();
      openingTime = new Date(openingTime * 1000);
      let  closingTime = await App.contractInstance.closingTime();
      closingTime = new Date(closingTime * 1000);
      let info = rate.toString() + "<br/> crowdsale address: " + addr +
		       "<br/> token: " + token + "<br/> Is Open? " + isOpen +
		       "<br/> openning time: " + openingTime.toUTCString() +
		       "<br/> closing time: " + closingTime.toUTCString();
      if (isOpen) {
        info = info + "<br/> Crowdsale has started ...";
        let raised = await App.contractInstance.weiRaised();
        let eth = raised / 10 ** 18;
        info = info + "<br/>     So far wei raised: " + raised + " Or eth: " + eth;
      }
    
    $('#value').html(info);

    App.setLoading(false)
  },

  set: async () => {
    App.setLoading(true)

    const newValue = $('#newValue').val()

//    await App.contractInstance.set(newValue)
    window.alert('Value updated! Refresh this page to see the new value (it might take a few seconds).')
  },

  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}

$(() => {
  $(window).load(() => {
    App.init()
  })
})
