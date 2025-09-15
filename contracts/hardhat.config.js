require("@nomicfoundation/hardhat-toolbox")

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    somnia: {
      url: "https://rpc.somnia.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 50311,
    },
    somniaTestnet: {
      url: "https://testnet-rpc.somnia.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 50312,
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 21,
  },
}
