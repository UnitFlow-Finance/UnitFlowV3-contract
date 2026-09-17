/**
 * Redeploys Router and PositionManager with the caller-lock security fix.
 *
 * Security fixes applied:
 *   - sweepToken(), unwrapWUSDC(), sweepTokenWithFee(), unwrapWUSDCWithFee(),
 *     refundUSDC() now require msg.sender == _callerLock (set at the start of
 *     every swap/mint/collect entry point and cleared on exit).  Previously
 *     these were unrestricted public functions that any third party could call
 *     to drain tokens left in the router or position manager.
 *   - Router getPool() now reverts with 'Pool does not exist' when the
 *     computed pool address has no deployed code, giving a clear error instead
 *     of a low-level revert when selling against an uninitialised pool.
 *
 * Unchanged contracts (reused from addresses.json):
 *   Factory, WUSDC, NFTDescriptor, NonfungibleTokenPositionDescriptor,
 *   Quoter, V3Migrator, TickLens, Multicall.
 */
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const FACTORY        = "0xAb6A8AAb7d490007634ef59d424b5d89688a1971";
const USDC          = "0x3600000000000000000000000000000000000000";
const NFT_POS_DESC   = "0x421EeCc906A63C7261671e60A0F2Be9D02bbeB50";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddr = await deployer.getAddress();
  console.log("Deployer :", deployerAddr);
  console.log("Balance  :", ethers.utils.formatEther(await deployer.getBalance()), "USDC\n");

  // ── 1. UnitFlowV3Router ──────────────────────────────────────────────────
  console.log("[1/2] Deploying UnitFlowV3Router (security fix)...");
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
  console.log("\n[2/2] Deploying UnitFlowV3PositionManager (security fix)...");
  const PositionManager = await ethers.getContractFactory(
    "contracts/periphery/UnitFlowV3PositionManager.sol:UnitFlowV3PositionManager"
  );
  const pm = await PositionManager.deploy(FACTORY, USDC, NFT_POS_DESC);
  await pm.deployed();
  console.log("  address  :", pm.address);
  console.log("  name()   :", await pm.name());
  console.log("  symbol() :", await pm.symbol());
  console.log("  USDC()  :", await pm.USDC());
  console.log("  factory():", await pm.factory());

  // ── Update addresses.json ────────────────────────────────────────────────
  const addrFile = path.join(__dirname, "../deployments/addresses.json");
  const addrs = JSON.parse(fs.readFileSync(addrFile, "utf8"));

  // Archive old addresses
  if (!addrs._deprecated) addrs._deprecated = {};
  addrs._deprecated["UnitFlowV3Router_pre_security_fix"]          = addrs.contracts.UnitFlowV3Router.address;
  addrs._deprecated["UnitFlowV3PositionManager_pre_security_fix"] = addrs.contracts.UnitFlowV3PositionManager.address;

  addrs.contracts.UnitFlowV3Router.address          = router.address;
  addrs.contracts.UnitFlowV3PositionManager.address = pm.address;

  fs.writeFileSync(addrFile, JSON.stringify(addrs, null, 2));
  console.log("\ndeployments/addresses.json updated.");

  console.log("\n========================================");
  console.log("  Security Fix Deployment Summary");
  console.log("========================================");
  console.log("UnitFlowV3Router         :", router.address);
  console.log("UnitFlowV3PositionManager:", pm.address);
  console.log("========================================");
  console.log("\nUnchanged contracts:");
  console.log("  Factory    :", FACTORY);
  console.log("  USDC      :", USDC);
  console.log("  NFTPosDesc :", NFT_POS_DESC);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
