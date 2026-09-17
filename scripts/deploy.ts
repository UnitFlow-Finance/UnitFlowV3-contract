import { ethers } from "hardhat";
import { Contract } from "ethers";

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
// bytes32 encoding of "USDC" for the native currency label
const NATIVE_CURRENCY_LABEL_BYTES = ethers.utils.formatBytes32String("USDC");

interface DeployedAddresses {
  unitFlowV3Factory: string;
  unitFlowV3Pool: string; // template info - pools are created via factory
  multicall: string;
  proxyAdmin: string;
  tickLens: string;
  nftDescriptorLibrary: string;
  nonfungibleTokenPositionDescriptor: string;
  descriptorProxy: string;
  unitFlowV3PositionManager: string;
  unitFlowV3Router: string;
  quoter: string;
  quoterV2: string;
  v3Migrator: string;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying UnitFlow V3 contracts with account:", deployerAddress);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "USDC");
  console.log("USDC address:", USDC_ADDRESS);
  console.log("---");

  const addresses: Partial<DeployedAddresses> = {};

  // 1. Deploy UnitFlowV3Factory
  console.log("\n[1/11] Deploying UnitFlowV3Factory...");
  const Factory = await ethers.getContractFactory("UnitFlowV3Factory");
  const factory = await Factory.deploy();
  await factory.deployed();
  addresses.unitFlowV3Factory = factory.address;
  console.log("  UnitFlowV3Factory:", factory.address);

  // 2. Enable 1bp fee tier
  console.log("\n[2/11] Enabling 1bp fee tier...");
  const tx1bp = await factory.enableFeeAmount(100, 1);
  await tx1bp.wait();
  console.log("  1bp fee tier enabled (fee=100, tickSpacing=1)");

  // 3. Deploy UnitFlowInterfaceMulticall
  console.log("\n[3/11] Deploying UnitFlowInterfaceMulticall...");
  const Multicall = await ethers.getContractFactory("UnitFlowInterfaceMulticall");
  const multicall = await Multicall.deploy();
  await multicall.deployed();
  addresses.multicall = multicall.address;
  console.log("  UnitFlowInterfaceMulticall:", multicall.address);

  // 4. Deploy TickLens
  console.log("\n[4/11] Deploying TickLens...");
  const TickLens = await ethers.getContractFactory("TickLens");
  const tickLens = await TickLens.deploy();
  await tickLens.deployed();
  addresses.tickLens = tickLens.address;
  console.log("  TickLens:", tickLens.address);

  // 5. Deploy NFTDescriptor library
  console.log("\n[5/11] Deploying NFTDescriptor library...");
  const NFTDescriptor = await ethers.getContractFactory("contracts/periphery/libraries/NFTDescriptor.sol:NFTDescriptor");
  const nftDescriptor = await NFTDescriptor.deploy();
  await nftDescriptor.deployed();
  addresses.nftDescriptorLibrary = nftDescriptor.address;
  console.log("  NFTDescriptor:", nftDescriptor.address);

  // 6. Deploy NonfungibleTokenPositionDescriptor (linked with NFTDescriptor)
  console.log("\n[6/11] Deploying NonfungibleTokenPositionDescriptor...");
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
  addresses.nonfungibleTokenPositionDescriptor = nftPosDesc.address;
  console.log("  NonfungibleTokenPositionDescriptor:", nftPosDesc.address);

  // 7. Deploy ProxyAdmin (from OpenZeppelin)
  console.log("\n[7/11] Deploying ProxyAdmin + TransparentUpgradeableProxy...");
  // We'll deploy the descriptor directly without proxy for simplicity on testnet
  // The proxy pattern adds complexity; using the descriptor address directly
  addresses.descriptorProxy = nftPosDesc.address;
  addresses.proxyAdmin = ethers.constants.AddressZero; // no proxy admin needed
  console.log("  Using descriptor directly (no proxy for testnet)");

  // 8. Deploy UnitFlowV3PositionManager
  console.log("\n[8/11] Deploying UnitFlowV3PositionManager...");
  const PositionManager = await ethers.getContractFactory("contracts/periphery/UnitFlowV3PositionManager.sol:UnitFlowV3PositionManager");
  const positionManager = await PositionManager.deploy(
    factory.address,
    USDC_ADDRESS,
    nftPosDesc.address
  );
  await positionManager.deployed();
  addresses.unitFlowV3PositionManager = positionManager.address;
  console.log("  UnitFlowV3PositionManager:", positionManager.address);

  // Verify NFT name and symbol
  const nftName = await positionManager.name();
  const nftSymbol = await positionManager.symbol();
  console.log(`  NFT Name: "${nftName}", Symbol: "${nftSymbol}"`);

  // 9. Deploy UnitFlowV3Router (SwapRouter)
  console.log("\n[9/11] Deploying UnitFlowV3Router (SwapRouter)...");
  const Router = await ethers.getContractFactory("contracts/periphery/UnitFlowV3Router.sol:UnitFlowV3Router");
  const router = await Router.deploy(factory.address, USDC_ADDRESS);
  await router.deployed();
  addresses.unitFlowV3Router = router.address;
  console.log("  UnitFlowV3Router:", router.address);

  // 10. Deploy Quoter
  console.log("\n[10/11] Deploying Quoter...");
  const Quoter = await ethers.getContractFactory("Quoter");
  const quoter = await Quoter.deploy(factory.address, USDC_ADDRESS);
  await quoter.deployed();
  addresses.quoter = quoter.address;
  console.log("  Quoter:", quoter.address);

  // 11. Deploy V3Migrator
  console.log("\n[11/11] Deploying V3Migrator...");
  const Migrator = await ethers.getContractFactory("V3Migrator");
  const migrator = await Migrator.deploy(
    factory.address,
    USDC_ADDRESS,
    positionManager.address
  );
  await migrator.deployed();
  addresses.v3Migrator = migrator.address;
  console.log("  V3Migrator:", migrator.address);

  // Summary
  console.log("\n========================================");
  console.log("  UnitFlow V3 Deployment Summary");
  console.log("========================================");
  console.log("Network: Arc Testnet (chainId: 5042002)");
  console.log("USDC:", USDC_ADDRESS);
  console.log("Deployer:", deployerAddress);
  console.log("---");
  console.log("UnitFlowV3Factory:", addresses.unitFlowV3Factory);
  console.log("UnitFlowInterfaceMulticall:", addresses.multicall);
  console.log("TickLens:", addresses.tickLens);
  console.log("NFTDescriptor:", addresses.nftDescriptorLibrary);
  console.log("NonfungibleTokenPositionDescriptor:", addresses.nonfungibleTokenPositionDescriptor);
  console.log("UnitFlowV3PositionManager:", addresses.unitFlowV3PositionManager);
  console.log("UnitFlowV3Router:", addresses.unitFlowV3Router);
  console.log("Quoter:", addresses.quoter);
  console.log("V3Migrator:", addresses.v3Migrator);
  console.log("---");
  console.log(`LP NFT Name: "${nftName}"`);
  console.log(`LP NFT Symbol: "${nftSymbol}"`);
  console.log("========================================");

  // Verify all USDC references
  const factoryUSDC = "N/A (factory doesn't store USDC)";
  const pmUSDC = await positionManager.USDC();
  const routerUSDC = await router.USDC();
  console.log("\nUSDC Verification:");
  console.log("  PositionManager.USDC():", pmUSDC);
  console.log("  Router.USDC():", routerUSDC);
  console.log("  Expected:", USDC_ADDRESS);
  console.log("  Match:", pmUSDC === USDC_ADDRESS && routerUSDC === USDC_ADDRESS ? "YES" : "NO");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
