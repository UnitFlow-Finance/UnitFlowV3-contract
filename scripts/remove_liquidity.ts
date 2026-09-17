import { ethers } from "hardhat";

const POSITION_MANAGER_ADDRESS = "0xbBCf12F9346efC3ea9Eae872476e8852772c5fBc";
const TOKEN_ID = 6; // From previous successful test run

async function main() {
  const [deployer] = await ethers.getSigners();
  const positionManager = await ethers.getContractAt("UnitFlowV3PositionManager", POSITION_MANAGER_ADDRESS);

  console.log("Removing all liquidity for Token ID:", TOKEN_ID);

  // 1. Get current position details
  const positionInfo = await positionManager.positions(TOKEN_ID);
  const remainingLiquidity = positionInfo[7];
  console.log("Remaining liquidity:", remainingLiquidity.toString());

  if (remainingLiquidity.gt(0)) {
    // 2. Decrease liquidity
    const decreaseParams = {
      tokenId: TOKEN_ID,
      liquidity: remainingLiquidity,
      amount0Min: 0,
      amount1Min: 0,
      deadline: Math.floor(Date.now() / 1000) + 60 * 60,
    };
    const decreaseTx = await positionManager.decreaseLiquidity(decreaseParams, { gasLimit: 8000000 });
    await decreaseTx.wait();
    console.log("Liquidity decreased, hash:", decreaseTx.hash);
  }

  // 3. Collect tokens (fees + principal)
  const collectParams = {
    tokenId: TOKEN_ID,
    recipient: deployer.address,
    amount0Max: ethers.BigNumber.from(2).pow(128).sub(1),
    amount1Max: ethers.BigNumber.from(2).pow(128).sub(1),
  };
  const collectTx = await positionManager.collect(collectParams, { gasLimit: 8000000 });
  await collectTx.wait();
  console.log("Collected tokens, hash:", collectTx.hash);

  // 4. Burn NFT
  const burnTx = await positionManager.burn(TOKEN_ID, { gasLimit: 8000000 });
  await burnTx.wait();
  console.log("Position NFT burned, hash:", burnTx.hash);

  console.log("All liquidity removed and position closed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
