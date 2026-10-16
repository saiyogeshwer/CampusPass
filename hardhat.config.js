require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const path = require("path");
const { subtask } = require("hardhat/config");
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require("hardhat/builtin-tasks/task-names");

const { SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

// Use the npm "solc" package (solc-js) when USE_SOLCJS=1. Handy on networks that block
// binaries.soliditylang.org. On a normal laptop you do not need this.
if (process.env.USE_SOLCJS === "1") {
  subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args, hre, runSuper) => {
    if (args.solcVersion === "0.8.24") {
      const compilerPath = require.resolve("solc/soljson.js");
      return { compilerPath, isSolcJs: true, version: "0.8.24", longVersion: "0.8.24+commit.e11b9ed9" };
    }
    return runSuper();
  });
}

module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" } },
  networks: {
    // Sepolia only registers when credentials exist, so local work never needs them.
    ...(SEPOLIA_RPC_URL && SEPOLIA_PRIVATE_KEY
      ? { sepolia: { url: SEPOLIA_RPC_URL, accounts: [SEPOLIA_PRIVATE_KEY], chainId: 11155111 } }
      : {}),
  },
  etherscan: { apiKey: ETHERSCAN_API_KEY || "" },
};
