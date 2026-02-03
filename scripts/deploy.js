const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const AgriChain = await hre.ethers.getContractFactory("AgriChain");
  const agriChain = await AgriChain.deploy();

  await agriChain.waitForDeployment(); // Hardhat v2.14+ syntax

  const address = await agriChain.getAddress();
  console.log(`AgriChain deployed to ${address}`);

  // Write to frontend config
  const configPath = path.join(__dirname, "../frontend/js/config.js");
  const configContent = `export const CONTRACT_ADDRESS = "${address}";\n`;
  
  fs.writeFileSync(configPath, configContent);
  console.log(`Address saved to ${configPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
