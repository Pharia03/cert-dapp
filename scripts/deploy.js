const hre = require("hardhat");

async function main() {
  const CertVerifier = await hre.ethers.getContractFactory("CertVerifier");
  const contract = await CertVerifier.deploy();
  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});