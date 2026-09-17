import { ethers } from "hardhat";

// Update with your Factory address
const FACTORY_ADDRESS = "0x08B79Cd0D7b51AF26d832a5e3be7e36Ec551d844";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Setting protocol fees with owner:", owner.address);

  const factory = await ethers.getContractAt("UnitFlowV3Factory", FACTORY_ADDRESS);

  // NOTE: This script assumes you have a way to discover all pools.
  // Standard Uniswap/UnitFlow V3 doesn't have a simple "getAllPools" function on the factory.
  // You would typically use a Subgraph or an indexer to get this list.
  // As a placeholder, replace this array with the actual pool addresses you want to update.
  const poolAddresses = [
    // "0xYourPoolAddress1",
    // "0xYourPoolAddress2",
  ];

  if (poolAddresses.length === 0) {
    console.log("No pool addresses provided. Please update the poolAddresses array in the script.");
    return;
  }

  for (const poolAddress of poolAddresses) {
    console.log(`Updating pool: ${poolAddress}`);
    const pool = await ethers.getContractAt("UnitFlowV3Pool", poolAddress);
    
    try {
      const tx = await pool.setFeeProtocol(4, 4);
      await tx.wait();
      console.log(`  Success! Protocol fee set to 4.`);
    } catch (error) {
      console.error(`  Failed to set fee for ${poolAddress}:`, error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
