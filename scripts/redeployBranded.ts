import { ethers } from "hardhat";

// Existing addresses that are NOT being redeployed
const FACTORY = "0x6Bec788fcDF5d0f5B6913414ECFABb57C3DD2D41";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const NATIVE_CURRENCY_LABEL_BYTES = ethers.utils.formatBytes32String("USDC");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Redeploying branded contracts with:", await deployer.getAddress());
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "USDC\n");

  // 1. Redeploy UnitFlowInterfaceMulticall (now has unique bytecode with name constant)
  console.log("[1/4] Deploying UnitFlowInterfaceMulticall...");
  const Multicall = await ethers.getContractFactory("UnitFlowInterfaceMulticall");
  const multicall = await Multicall.deploy();
  await multicall.deployed();
  const multicallName = await multicall.name();
  console.log("  UnitFlowInterfaceMulticall:", multicall.address);
  console.log("  name():", multicallName);

  // 2. Redeploy NFTDescriptor library (contains 'UnitFlow - ' string)
  console.log("\n[2/4] Deploying NFTDescriptor library...");
  const NFTDescriptor = await ethers.getContractFactory(
    "contracts/periphery/libraries/NFTDescriptor.sol:NFTDescriptor"
  );
  const nftDescriptor = await NFTDescriptor.deploy();
  await nftDescriptor.deployed();
  console.log("  NFTDescriptor:", nftDescriptor.address);

  // 3. Redeploy NonfungibleTokenPositionDescriptor (linked to new NFTDescriptor)
  console.log("\n[3/4] Deploying NonfungibleTokenPositionDescriptor...");
  const NftPosDescFactory = await ethers.getContractFactory(
    "contracts/periphery/NonfungibleTokenPositionDescriptor.sol:NonfungibleTokenPositionDescriptor",
    {
      libraries: {
        "contracts/periphery/libraries/NFTDescriptor.sol:NFTDescriptor": nftDescriptor.address,
      },
    }
  );
  const nftPosDesc = await NftPosDescFactory.deploy(USDC_ADDRESS, NATIVE_CURRENCY_LABEL_BYTES);
  await nftPosDesc.deployed();
  console.log("  NonfungibleTokenPositionDescriptor:", nftPosDesc.address);

  // 4. Redeploy UnitFlowV3PositionManager (points to new descriptor)
  console.log("\n[4/4] Deploying UnitFlowV3PositionManager...");
  const PositionManager = await ethers.getContractFactory(
    "contracts/periphery/UnitFlowV3PositionManager.sol:UnitFlowV3PositionManager"
  );
  const positionManager = await PositionManager.deploy(
    FACTORY,
    USDC_ADDRESS,
    nftPosDesc.address
  );
  await positionManager.deployed();
  console.log("  UnitFlowV3PositionManager:", positionManager.address);

  const nftName = await positionManager.name();
  const nftSymbol = await positionManager.symbol();
  console.log(`  NFT Name: "${nftName}", Symbol: "${nftSymbol}"`);

  console.log("\n========================================");
  console.log("  Redeployment Summary");
  console.log("========================================");
  console.log("multicall:                         ", multicall.address);
  console.log("nftDescriptorLibrary:              ", nftDescriptor.address);
  console.log("nonfungibleTokenPositionDescriptor:", nftPosDesc.address);
  console.log("positionManager:                   ", positionManager.address);
  console.log("========================================");
  console.log("\nUpdate DEPLOYED in verifyDeployment.ts and deploy.ts with these addresses.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
