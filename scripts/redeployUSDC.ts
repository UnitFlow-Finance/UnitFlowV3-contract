import { ethers } from "hardhat";

// Unchanged addresses
const FACTORY   = "0x6Bec788fcDF5d0f5B6913414ECFABb57C3DD2D41";
const USDC     = "0x3600000000000000000000000000000000000000";
const MULTICALL = "0x3eDE54e10573070E64b44b9FDA17cFFe140A654a";
const TICKLENS  = "0xCF4D699b5eeC35C96760640666B1Ca8f69F000BF";
const QUOTER    = "0xF037748F6ab4F0C15f5C6cE05A22370991098ded";

const NATIVE_CURRENCY_LABEL_BYTES = ethers.utils.formatBytes32String("USDC");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "USDC\n");

  // 1. NFTDescriptor (contains 'UnitFlow - ' string, USDC-branded)
  console.log("[1/5] Deploying NFTDescriptor...");
  const NFTDescriptor = await ethers.getContractFactory(
    "contracts/periphery/libraries/NFTDescriptor.sol:NFTDescriptor"
  );
  const nftDescriptor = await NFTDescriptor.deploy();
  await nftDescriptor.deployed();
  console.log("  NFTDescriptor:", nftDescriptor.address);

  // 2. NonfungibleTokenPositionDescriptor (linked to new NFTDescriptor)
  console.log("\n[2/5] Deploying NonfungibleTokenPositionDescriptor...");
  const NftPosDescFactory = await ethers.getContractFactory(
    "contracts/periphery/NonfungibleTokenPositionDescriptor.sol:NonfungibleTokenPositionDescriptor",
    {
      libraries: {
        "contracts/periphery/libraries/NFTDescriptor.sol:NFTDescriptor": nftDescriptor.address,
      },
    }
  );
  const nftPosDesc = await NftPosDescFactory.deploy(USDC, NATIVE_CURRENCY_LABEL_BYTES);
  await nftPosDesc.deployed();
  console.log("  NonfungibleTokenPositionDescriptor:", nftPosDesc.address);

  // 3. UnitFlowV3PositionManager (refundUSDC)
  console.log("\n[3/5] Deploying UnitFlowV3PositionManager...");
  const PositionManager = await ethers.getContractFactory(
    "contracts/periphery/UnitFlowV3PositionManager.sol:UnitFlowV3PositionManager"
  );
  const positionManager = await PositionManager.deploy(FACTORY, USDC, nftPosDesc.address);
  await positionManager.deployed();
  console.log("  UnitFlowV3PositionManager:", positionManager.address);
  console.log("  NFT Name:", await positionManager.name());
  console.log("  NFT Symbol:", await positionManager.symbol());

  // 4. UnitFlowV3Router (refundUSDC, name constant)
  console.log("\n[4/5] Deploying UnitFlowV3Router...");
  const Router = await ethers.getContractFactory(
    "contracts/periphery/UnitFlowV3Router.sol:UnitFlowV3Router"
  );
  const router = await Router.deploy(FACTORY, USDC);
  await router.deployed();
  console.log("  UnitFlowV3Router:", router.address);

  // 5. V3Migrator (ABI changed: refundAsETH -> refundAsUSDC)
  console.log("\n[5/5] Deploying V3Migrator...");
  const Migrator = await ethers.getContractFactory("V3Migrator");
  const migrator = await Migrator.deploy(FACTORY, USDC, positionManager.address);
  await migrator.deployed();
  console.log("  V3Migrator:", migrator.address);

  console.log("\n========================================");
  console.log("  USDC Redeployment Summary");
  console.log("========================================");
  console.log("factory:                           ", FACTORY,   "(unchanged)");
  console.log("multicall:                         ", MULTICALL, "(unchanged)");
  console.log("tickLens:                          ", TICKLENS,  "(unchanged)");
  console.log("quoter:                            ", QUOTER,    "(unchanged)");
  console.log("nftDescriptorLibrary:              ", nftDescriptor.address);
  console.log("nonfungibleTokenPositionDescriptor:", nftPosDesc.address);
  console.log("positionManager:                   ", positionManager.address);
  console.log("router:                            ", router.address);
  console.log("migrator:                          ", migrator.address);
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
