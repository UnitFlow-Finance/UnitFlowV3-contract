import { ethers } from "hardhat";

// Deployed addresses
const FACTORY = "0x08B79Cd0D7b51AF26d832a5e3be7e36Ec551d844";
const POSITION_MANAGER = "0x0b4d1D6f45D72C8743de67866b41BcC56Bf4dDFb";
const ROUTER = "0xA3B1561A0004dCba4068999172eA36373AFdd588";

// Tokens
const TOKEN_NATIVE_USDC = "0x3600000000000000000000000000000000000000"; // User-provided address
const TOKEN_MOCK = "0x7D6C32e0BD1A8e8D187abd0Ba0E56Acb3B6dbE74"; // MockERC20

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing liquidity & swap on Arc Testnet with account:", signer.address);

  // 1. Approve PositionManager to spend Mock Token
  const mockToken = await ethers.getContractAt("MockERC20", TOKEN_MOCK);
  console.log("Approving PositionManager to spend Mock Token...");
  await (await mockToken.approve(POSITION_MANAGER, ethers.utils.parseEther("1000"))).wait();

  // 2. Mint Liquidity (simplified for test)
  console.log("Minting liquidity position...");
  const pm = await ethers.getContractAt("UnitFlowV3PositionManager", POSITION_MANAGER);
  
  // NOTE: This will likely fail if TOKEN_NATIVE_USDC is not a valid ERC20 contract
  try {
    await pm.mint({
        token0: TOKEN_MOCK,
        token1: TOKEN_NATIVE_USDC,
        fee: 3000,
        tickLower: -60000,
        tickUpper: 60000,
        amount0Desired: ethers.utils.parseEther("1"),
        amount1Desired: ethers.utils.parseEther("1"), // Assuming 18 decimals for both
        amount0Min: 0,
        amount1Min: 0,
        recipient: signer.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10
    }, { gasLimit: 5000000 });
    console.log("Liquidity minted!");
  } catch (err) {
    console.error("Minting failed (expected if WUSDC is not an ERC20):", err);
  }

  console.log("Test script finished.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
