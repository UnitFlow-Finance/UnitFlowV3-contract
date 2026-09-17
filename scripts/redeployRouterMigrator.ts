import { ethers } from "hardhat";

const FACTORY          = "0x6Bec788fcDF5d0f5B6913414ECFABb57C3DD2D41";
const USDC            = "0x3600000000000000000000000000000000000000";
const POSITION_MANAGER = "0x677E6AbBFEC2FaB0F741Ef51D51B0c53c504937D";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "USDC\n");

  // 1. UnitFlowV3Router
  console.log("[1/2] Deploying UnitFlowV3Router...");
  const Router = await ethers.getContractFactory(
    "contracts/periphery/UnitFlowV3Router.sol:UnitFlowV3Router"
  );
  const router = await Router.deploy(FACTORY, USDC);
  await router.deployed();
  const routerName = await router.name();
  console.log("  UnitFlowV3Router:", router.address);
  console.log("  name():", routerName);

  // 2. V3Migrator (refundAsUSDC)
  console.log("\n[2/2] Deploying V3Migrator...");
  const Migrator = await ethers.getContractFactory("V3Migrator");
  const migrator = await Migrator.deploy(FACTORY, USDC, POSITION_MANAGER);
  await migrator.deployed();
  const migratorName = await migrator.name();
  console.log("  V3Migrator:", migrator.address);
  console.log("  name():", migratorName);

  console.log("\n========================================");
  console.log("  Summary — update verifyDeployment.ts");
  console.log("========================================");
  console.log("router:  ", router.address);
  console.log("migrator:", migrator.address);
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
