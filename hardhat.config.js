require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/YgzpRInm5zuPQILaCPUlJ",
      accounts: ["fe8fba8b399614b19c555b73885f0c55f95c162de62fee5930756935c888cd47"]
    }
  }
};

