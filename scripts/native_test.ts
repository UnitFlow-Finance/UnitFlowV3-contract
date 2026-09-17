import { ethers } from "hardhat";

const POSITION_MANAGER_ADDRESS = "0xbBCf12F9346efC3ea9Eae872476e8852772c5fBc";
const ROUTER_ADDRESS = "0x062072529C263d6a2F780c71E39be65FC4e84A90";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const WUSDC_ADDRESS = "0x0Ba5B8B53e15126A4dB99510f97FD92414c85eEe"; // Using a placeholder pool or WUSDC address if applicable, need to check if WUSDC exists.
// Based on previous comprehensive_test run, the pool address is 0x0Ba5B8B53e15126A4dB99510f97FD92414c85eEe

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing native currency integration (no-wrap) with account:", deployer.address);

  // Router assumes native token interaction via address(0)
  const router = await ethers.getContractAt("UnitFlowV3Router", ROUTER_ADDRESS);

  // Attempting a swap by sending native currency directly
  console.log("Sending native currency for swap...");
  const swapValue = ethers.utils.parseEther("0.01");
  
  // NOTE: This assumes the Router has a function like `exactInputSingle`
  // that is marked `payable` and supports native currency (address 0).
  // This is a direct test of the contract's ability to handle native value.
  
  try {
    // This is a placeholder call signature; needs adjustment based on actual Router interface
    const tx = await router.exactInputSingle({
      tokenIn: "0x0000000000000000000000000000000000000000", // Represents native
      tokenOut: USDC_ADDRESS,
      fee: 3000,
      recipient: deployer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: swapValue,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    }, { value: swapValue });
    await tx.wait();
    console.log("Native swap hash:", tx.hash);
  } catch (error) {
    console.log("Swap failed (expected if Router doesn't support native):", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
