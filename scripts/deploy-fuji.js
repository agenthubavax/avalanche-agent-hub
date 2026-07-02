import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  // Deploy AgentRegistry
  console.log("\n--- Deploying AgentRegistry ---");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddr = await agentRegistry.getAddress();
  console.log("AgentRegistry deployed to:", agentRegistryAddr);

  // Deploy QuestFactory
  console.log("\n--- Deploying QuestFactory ---");
  const QuestFactory = await ethers.getContractFactory("QuestFactory");
  const questFactory = await QuestFactory.deploy();
  await questFactory.waitForDeployment();
  const questFactoryAddr = await questFactory.getAddress();
  console.log("QuestFactory deployed to:", questFactoryAddr);

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network: Fuji Testnet (Chain ID 43113)");
  console.log("AgentRegistry:", agentRegistryAddr);
  console.log("QuestFactory:", questFactoryAddr);
  console.log("Deployer:", deployer.address);
  console.log("\nVerify on Snowtrace:");
  console.log("https://testnet.snowtrace.io/address/" + agentRegistryAddr);
  console.log("https://testnet.snowtrace.io/address/" + questFactoryAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
