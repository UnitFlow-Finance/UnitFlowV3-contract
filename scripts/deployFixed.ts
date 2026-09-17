/**
 * Deploys corrected Router and PositionManager.
 * Fixes applied vs previously deployed contracts:
 *   - refundUSDC() now correctly named (was compiled as refundETH in old bytecode)
 *   - name() public constant present on Router
 *
 * Reuses all unchanged contracts from addresses.json.
 */
import { ethers } from "hardhat";

// Unchanged deployed contracts
// FACTORY must be the one that created the existing pools (0xAb6A8AAb7...)
const FACTORY          = "0xAb6A8AAb7d490007634ef59d424b5d89688a1971";
const USDC            = "0x3600000000000000000000000000000000000000";
const NFT_DESCRIPTOR   = "0x9A37137Bdf62d3ddfA648f1616fcF38A91637660";
const NFT_POS_DESC     = "0x421EeCc906A63C7261671e60A0F2Be9D02bbeB50";

const NATIVE_CURRENCY_LABEL_BYTES = ethers.utils.formatBytes32String("USDC");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer :", await deployer.getAddress());
  console.log("Balance  :", ethers.utils.formatEther(await deployer.getBalance()), "USDC\n");

  // ── 1. UnitFlowV3Router ──────────────────────────────────────────────────
  console.log("[1/2] Deploying UnitFlowV3Router...");
  const Router = await ethers.getContractFactory(
    "contracts/periphery/UnitFlowV3Router.sol:UnitFlowV3Router"
  );
  const router = await Router.deploy(FACTORY, USDC);
  await router.deployed();
  console.log("  address  :", router.address);
  console.log("  name()   :", await router.name());
  console.log("  USDC()  :", await router.USDC());
  console.log("  factory():", await router.factory());

  // ── 2. UnitFlowV3PositionManager ─────────────────────────────────────────
  console.log("\n[2/2] Deploying UnitFlowV3PositionManager...");
  const PositionManager = await ethers.getContractFactory(
    "contracts/periphery/UnitFlowV3PositionManager.sol:UnitFlowV3PositionManager"
  );
  const positionManager = await PositionManager.deploy(FACTORY, USDC, NFT_POS_DESC);
  await positionManager.deployed();
  console.log("  address  :", positionManager.address);
  console.log("  name()   :", await positionManager.name());
  console.log("  symbol() :", await positionManager.symbol());
  console.log("  USDC()  :", await positionManager.USDC());
  console.log("  factory():", await positionManager.factory());

  console.log("\n========================================");
  console.log("  Deployment Summary");
  console.log("========================================");
  console.log("UnitFlowV3Router         :", router.address);
  console.log("UnitFlowV3PositionManager:", positionManager.address);
  console.log("========================================");
  console.log("\nUnchanged contracts:");
  console.log("  Factory   :", FACTORY);
  console.log("  USDC     :", USDC);
  console.log("  NFTDesc   :", NFT_DESCRIPTOR);
  console.log("  PosDesc   :", NFT_POS_DESC);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
