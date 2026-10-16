// Deploys CampusPass to the selected network and writes the address + ABI for the frontend.
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { name } = hre.network;
  if (name === "mainnet") throw new Error("Refusing to deploy to mainnet.");
  const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Network: ${name} (chainId ${chainId})\nDeployer: ${deployer.address}`);
  if (name === "sepolia" && chainId !== 11155111) throw new Error("Chain ID is not Sepolia.");

  const cp = await (await hre.ethers.getContractFactory("CampusPass")).deploy();
  await cp.waitForDeployment();
  const address = await cp.getAddress();
  const tx = cp.deploymentTransaction();
  console.log(`CampusPass deployed to: ${address}\nDeployment tx: ${tx.hash}`);

  const out = path.join(__dirname, "..", "frontend", "src", "contracts");
  fs.mkdirSync(out, { recursive: true });
  const artifact = await hre.artifacts.readArtifact("CampusPass");
  fs.writeFileSync(path.join(out, "CampusPassABI.json"), JSON.stringify(artifact.abi, null, 2));
  fs.writeFileSync(path.join(out, `deployment.${chainId}.json`), JSON.stringify({ address, chainId, txHash: tx.hash }, null, 2));
  console.log(`Wrote ABI and deployment.${chainId}.json to frontend/src/contracts`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
