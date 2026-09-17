import { ethers } from "hardhat";

const POSITION_MANAGER_ADDRESS = "0xbBCf12F9346efC3ea9Eae872476e8852772c5fBc";
const TOKEN_IDS = [1, 2, 3, 4, 5];

async function main() {
  const [deployer] = await ethers.getSigners();
  const positionManager = await ethers.getContractAt("UnitFlowV3PositionManager", POSITION_MANAGER_ADDRESS);

  for (const tokenId of TOKEN_IDS) {
    console.log("--- Processing Token ID:", tokenId, "---");
    
    try {
      // Check if position exists
      const positionInfo = await positionManager.positions(tokenId);
      const remainingLiquidity = positionInfo[7];
      console.log("Remaining liquidity:", remainingLiquidity.toString());

      // 1. Decrease liquidity if > 0
      if (remainingLiquidity.gt(0)) {
        const decreaseParams = {
          tokenId,
          liquidity: remainingLiquidity,
          amount0Min: 0,
          amount1Min: 0,
          deadline: Math.floor(Date.now() / 1000) + 60 * 60,
        };
        const decreaseTx = await positionManager.decreaseLiquidity(decreaseParams, { gasLimit: 8000000 });
        await decreaseTx.wait();
        console.log("Liquidity decreased.");
      }

      // 2. Collect tokens
      const collectParams = {
        tokenId,
        recipient: deployer.address,
        amount0Max: ethers.BigNumber.from(2).pow(128).sub(1),
        amount1Max: ethers.BigNumber.from(2).pow(128).sub(1),
      };
      const collectTx = await positionManager.collect(collectParams, { gasLimit: 8000000 });
      await collectTx.wait();
      console.log("Tokens collected.");

      // 3. Burn NFT
      const burnTx = await positionManager.burn(tokenId, { gasLimit: 8000000 });
      await burnTx.wait();
      console.log("Position NFT burned.");
    } catch (error) {
      console.log("Skipping or error for Token ID", tokenId, ":", error.message);
    }
  }

  console.log("Cleanup of Token IDs 1-5 completed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
