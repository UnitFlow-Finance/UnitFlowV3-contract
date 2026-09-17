import { ethers, run } from "hardhat";

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
// bytes32 encoding of "USDC"
const NATIVE_CURRENCY_LABEL_BYTES =
  "0x5553444300000000000000000000000000000000000000000000000000000000";

const DEPLOYED = {
  factory: "0x5bfBCeb73d39F722B1cB83fD2F11736b28c1Be6d",
  multicall: "0xc9E1780bA34698C1067EA6B2fcF78f111a5F110b",
  tickLens: "0x20Df732207340234E490a1e686A3A8055AF59b4e",
 nftDescriptorLibrary: "0x9Ca8e324380Aa2E80011A16C4d684366E47d4Ab4",
  nonfungibleTokenPositionDescriptor:
    "0x5Bc0735F5D806C184EDE0A7731632F7c491B3B02",
  positionManager: "0x300F5f2861eF0d9D3c6B812797C0A4c8b15C86a8",
  router: "0x6fD8351b9596C1F0b2f2479BfA6A171cb3d0f410",
  quoter: "0x5AF6E89F0960Ff375AF84d9911D8153ef6240E34",
  migrator: "0x36E9b24b9CF39c4C7069B75f01FA0419547F977a",
};

// Submit source verification to ArcScan; skip gracefully if already verified.
// Uses verify:verify (the stable programmatic API) which accepts constructorArguments
// as an array and libraries as an object, then delegates to verify:etherscan internally.
// Also handles a known hardhat-verify@1.1.1 bug where ContractVerificationFailedError
// is thrown after the full-input fallback even when verification succeeds — confirmed
// by re-querying the ArcScan API directly.
async function verifyOnExplorer(
  address: string,
  constructorArguments: any[],
  contract?: string,
  libraries?: Record<string, string>
): Promise<void> {
  try {
    await run("verify:verify", {
      address,
      constructorArguments,
      contract,
      libraries: libraries ?? {},
    });
  } catch (err: any) {
    const msg = err?.message?.toLowerCase() ?? "";
    if (msg.includes("already been verified") || msg.includes("already verified")) {
      console.log(`  Already verified on ArcScan: ${address}`);
      return;
    }
    // hardhat-verify@1.1.1 bug: throws after full-input fallback even on success.
    // Re-check ArcScan API directly to confirm whether verification landed.
    if (msg.includes("unable to verify") || msg.includes("verification failed")) {
      const http = await import("https");
      const apiUrl = `https://explorer.arc.io/api?module=contract&action=getsourcecode&address=${address}`;
      const confirmed = await new Promise<boolean>((resolve) => {
        http.get(apiUrl, (res: any) => {
          let data = "";
          res.on("data", (chunk: any) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              const contractName = json?.result?.[0]?.ContractName ?? "";
              resolve(contractName.length > 0 && json.status === "1");
            } catch {
              resolve(false);
            }
          });
        }).on("error", () => resolve(false));
      });
      if (confirmed) {
        console.log(`  Verified on ArcScan (confirmed via API): ${address}`);
        return;
      }
    }
    throw err;
  }
}

async function main() {
  console.log("Verifying UnitFlow V3 Deployment...\n");

  // =========================================================
  // 1. CHECK ALL CONTRACTS EXIST ON-CHAIN
  // =========================================================
  console.log("1. Checking deployed contracts...\n");

  for (const [name, address] of Object.entries(DEPLOYED)) {
    const code = await ethers.provider.getCode(address);
    if (code === "0x") {
      throw new Error(`${name} not deployed at ${address}`);
    }
    console.log(`  [ok] ${name}: ${address}`);
  }

  console.log("\n---");

  // =========================================================
  // 2. FACTORY
  // =========================================================
  console.log("2. Verifying Factory...\n");

  const factory = await ethers.getContractAt(
    "UnitFlowV3Factory",
    DEPLOYED.factory
  );

  const tickSpacing = await factory.feeAmountTickSpacing(100);
  console.log("  tickSpacing (1bp fee):", tickSpacing.toString());

  if (tickSpacing.toString() !== "1") {
    throw new Error("1bp fee tier not set correctly");
  }

  await verifyOnExplorer(
    DEPLOYED.factory,
    [],
    "contracts/core/UnitFlowV3Factory.sol:UnitFlowV3Factory"
  );
  console.log("  [ok] Factory\n---");

  // =========================================================
  // 3. MULTICALL
  // =========================================================
  console.log("3. Verifying Multicall...\n");

  await verifyOnExplorer(
    DEPLOYED.multicall,
    [],
    "contracts/periphery/lens/UnitFlowInterfaceMulticall.sol:UnitFlowInterfaceMulticall"
  );
  console.log("  [ok] Multicall\n---");

  // =========================================================
  // 4. TICK LENS
  // =========================================================
  console.log("4. Verifying TickLens...\n");

  await verifyOnExplorer(
    DEPLOYED.tickLens,
    [],
    "contracts/periphery/lens/TickLens.sol:TickLens"
  );
  console.log("  [ok] TickLens\n---");

  // =========================================================
  // 5. NFT DESCRIPTOR LIBRARY
  // =========================================================
  console.log("5. Verifying NFTDescriptor library...\n");

  await verifyOnExplorer(
    DEPLOYED.nftDescriptorLibrary,
    [],
    "contracts/periphery/libraries/NFTDescriptor.sol:NFTDescriptor"
  );
  console.log("  [ok] NFTDescriptor library\n---");

  // =========================================================
  // 6. NONFUNGIBLE TOKEN POSITION DESCRIPTOR
  // =========================================================
  console.log("6. Verifying NonfungibleTokenPositionDescriptor...\n");

  const descriptor = await ethers.getContractAt(
    "NonfungibleTokenPositionDescriptor",
    DEPLOYED.nonfungibleTokenPositionDescriptor
  );

  const descUSDC = await descriptor.USDC();
  const nativeLabelBytes = await descriptor.nativeCurrencyLabelBytes();
  const nativeLabel = await descriptor.nativeCurrencyLabel();

  console.log("  USDC:", descUSDC);
  console.log("  Label (raw bytes32):", nativeLabelBytes);
  console.log("  Label (decoded):", nativeLabel);

  if (descUSDC !== USDC_ADDRESS) throw new Error("Descriptor USDC mismatch");
  if (nativeLabel !== "USDC") throw new Error("Native currency label mismatch");

  await verifyOnExplorer(
    DEPLOYED.nonfungibleTokenPositionDescriptor,
    [USDC_ADDRESS, NATIVE_CURRENCY_LABEL_BYTES],
    "contracts/periphery/NonfungibleTokenPositionDescriptor.sol:NonfungibleTokenPositionDescriptor",
    {
      "contracts/periphery/libraries/NFTDescriptor.sol:NFTDescriptor":
        DEPLOYED.nftDescriptorLibrary,
    }
  );
  console.log("  [ok] NonfungibleTokenPositionDescriptor\n---");

  // =========================================================
  // 7. POSITION MANAGER
  // =========================================================
  console.log("7. Verifying Position Manager...\n");

  const pm = await ethers.getContractAt(
    "UnitFlowV3PositionManager",
    DEPLOYED.positionManager
  );

  const pmFactory = await pm.factory();
  const pmUSDC = await pm.USDC();
  const nftName = await pm.name();
  const nftSymbol = await pm.symbol();

  console.log("  factory:", pmFactory);
  console.log("  USDC:", pmUSDC);
  console.log("  NFT Name:", nftName);
  console.log("  NFT Symbol:", nftSymbol);

  if (pmFactory !== DEPLOYED.factory) throw new Error("PositionManager factory mismatch");
  if (pmUSDC !== USDC_ADDRESS) throw new Error("PositionManager USDC mismatch");

  await verifyOnExplorer(
    DEPLOYED.positionManager,
    [DEPLOYED.factory, USDC_ADDRESS, DEPLOYED.nonfungibleTokenPositionDescriptor],
    "contracts/periphery/UnitFlowV3PositionManager.sol:UnitFlowV3PositionManager"
  );
  console.log("  [ok] Position Manager\n---");

  // =========================================================
  // 8. ROUTER
  // =========================================================
  console.log("8. Verifying Router...\n");

  const router = await ethers.getContractAt("UnitFlowV3Router", DEPLOYED.router);

  const routerFactory = await router.factory();
  const routerUSDC = await router.USDC();

  console.log("  factory:", routerFactory);
  console.log("  USDC:", routerUSDC);

  if (routerFactory !== DEPLOYED.factory) throw new Error("Router factory mismatch");
  if (routerUSDC !== USDC_ADDRESS) throw new Error("Router USDC mismatch");

  await verifyOnExplorer(
    DEPLOYED.router,
    [DEPLOYED.factory, USDC_ADDRESS],
    "contracts/periphery/UnitFlowV3Router.sol:UnitFlowV3Router"
  );
  console.log("  [ok] Router\n---");

  // =========================================================
  // 9. QUOTER
  // =========================================================
  console.log("9. Verifying Quoter...\n");

  const quoter = await ethers.getContractAt("Quoter", DEPLOYED.quoter);

  const quoterFactory = await quoter.factory();
  const quoterUSDC = await quoter.USDC();

  console.log("  factory:", quoterFactory);
  console.log("  USDC:", quoterUSDC);

  if (quoterFactory !== DEPLOYED.factory) throw new Error("Quoter factory mismatch");
  if (quoterUSDC !== USDC_ADDRESS) throw new Error("Quoter USDC mismatch");

  await verifyOnExplorer(
    DEPLOYED.quoter,
    [DEPLOYED.factory, USDC_ADDRESS],
    "contracts/periphery/lens/Quoter.sol:Quoter"
  );
  console.log("  [ok] Quoter\n---");

  // =========================================================
  // 10. MIGRATOR
  // =========================================================
  console.log("10. Verifying Migrator...\n");

  const migrator = await ethers.getContractAt("V3Migrator", DEPLOYED.migrator);

  const migratorFactory = await migrator.factory();
  const migratorUSDC = await migrator.USDC();

  console.log("  factory:", migratorFactory);
  console.log("  USDC:", migratorUSDC);

  if (migratorFactory !== DEPLOYED.factory) throw new Error("Migrator factory mismatch");
  if (migratorUSDC !== USDC_ADDRESS) throw new Error("Migrator USDC mismatch");

  await verifyOnExplorer(
    DEPLOYED.migrator,
    [DEPLOYED.factory, USDC_ADDRESS, DEPLOYED.positionManager],
    "contracts/periphery/V3Migrator.sol:V3Migrator"
  );
  console.log("  [ok] Migrator\n---");

  // =========================================================
  // FINAL RESULT
  // =========================================================
  console.log("\n=======================================");
  console.log("ALL VERIFICATIONS PASSED SUCCESSFULLY");
  console.log("=======================================\n");
  console.log("ArcScan links:");
  for (const [name, address] of Object.entries(DEPLOYED)) {
    console.log(`  ${name}: https://testnet.arcscan.app/address/${address}#code`);
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nVERIFICATION FAILED");
    console.error(error);
    process.exit(1);
  });
