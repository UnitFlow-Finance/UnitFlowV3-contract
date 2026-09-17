import { ethers } from "hardhat";
import { BigNumber } from "ethers";

const FACTORY_ADDRESS = "0x83e452a88d265818e209AAb618a004b50BE0fB38";
const POSITION_MANAGER_ADDRESS = "0xbBCf12F9346efC3ea9Eae872476e8852772c5fBc";
const ROUTER_ADDRESS = "0x062072529C263d6a2F780c71E39be65FC4e84A90";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Running comprehensive test with account:", deployer.address);

  // 1. Deploy MockERC20
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy("Mock Token", "MTK", ethers.utils.parseEther("1000000"));
  await mockERC20.deployed();
  const MOCK_ADDRESS = mockERC20.address;
  console.log("MockERC20 deployed to:", MOCK_ADDRESS);

  // Sort tokens
  const token0 = USDC_ADDRESS.toLowerCase() < MOCK_ADDRESS.toLowerCase() ? USDC_ADDRESS : MOCK_ADDRESS;
  const token1 = USDC_ADDRESS.toLowerCase() < MOCK_ADDRESS.toLowerCase() ? MOCK_ADDRESS : USDC_ADDRESS;

  // 2. Initialize pool
  const factory = await ethers.getContractAt("UnitFlowV3Factory", FACTORY_ADDRESS);
  const fee = 3000; // 0.3%
  const createPoolTx = await factory.createPool(token0, token1, fee);
  await createPoolTx.wait();
  console.log("Pool created, hash:", createPoolTx.hash);

  const poolAddress = await factory.getPool(token0, token1, fee);
  console.log("Pool address:", poolAddress);

  // Initialize pool price (1:1)
  const pool = await ethers.getContractAt("UnitFlowV3Pool", poolAddress);
  const sqrtPriceX96 = BigNumber.from("79228162514264337593543950336"); // sqrt(1) * 2^96
  await pool.initialize(sqrtPriceX96);
  console.log("Pool initialized.");

  // 3. Approve tokens and check balances
  const usdc = await ethers.getContractAt("MockERC20", USDC_ADDRESS);
  const mtkToken = await ethers.getContractAt("MockERC20", MOCK_ADDRESS);
  
  // Dynamically get decimals
  const usdcDecimals = await usdc.decimals();
  const mtkDecimals = await mtkToken.decimals();
  
  const amount0Desired = ethers.utils.parseUnits("10", token0 === USDC_ADDRESS ? usdcDecimals : mtkDecimals);
  const amount1Desired = ethers.utils.parseUnits("10", token1 === USDC_ADDRESS ? usdcDecimals : mtkDecimals);

  await usdc.approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther("1000000000000"));
  await mtkToken.approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther("1000000000000"));
  await usdc.approve(ROUTER_ADDRESS, ethers.utils.parseEther("1000000000000"));
  await mtkToken.approve(ROUTER_ADDRESS, ethers.utils.parseEther("1000000000000"));
  
  const usdcBalance = await usdc.balanceOf(deployer.address);
  const mtkBalance = await mtkToken.balanceOf(deployer.address);
  console.log("Balances - USDC:", usdcBalance.toString(), "MTK:", mtkBalance.toString());
  console.log("Approvals granted.");
  
  const allowance0 = await usdc.allowance(deployer.address, POSITION_MANAGER_ADDRESS);
  const allowance1 = await mtkToken.allowance(deployer.address, POSITION_MANAGER_ADDRESS);
  console.log("Allowances - USDC:", allowance0.toString(), "MTK:", allowance1.toString());

  // 4. Add liquidity
  const positionManager = await ethers.getContractAt("UnitFlowV3PositionManager", POSITION_MANAGER_ADDRESS);
  const mintParams = {
    token0,
    token1,
    fee,
    tickLower: -60000,
    tickUpper: 60000,
    amount0Desired: amount0Desired,
    amount1Desired: amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  console.log("Mint Params:", JSON.stringify(mintParams, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  , 2));

  // Pre-mint validation: Calculate expected amounts (approximation)
  const poolContract = await ethers.getContractAt("UnitFlowV3Pool", poolAddress);
  const [currentSqrtPrice] = await poolContract.slot0();
  
  // NOTE: This is a simplified check, actual amount calculation is complex
  console.log("Current SqrtPriceX96:", currentSqrtPrice.toString());
  
  const mintTx = await positionManager.mint(mintParams, { gasLimit: 8000000 });
  const mintReceipt = await mintTx.wait();
  console.log("Liquidity added, hash:", mintTx.hash);
  
  // Get tokenId and liquidity
  const logs = mintReceipt.logs.filter(l => l.address.toLowerCase() === POSITION_MANAGER_ADDRESS.toLowerCase());
  console.log("Found", logs.length, "relevant logs.");
  
  let increaseLiquidityEvent;
  for (const log of logs) {
    try {
      const parsedLog = positionManager.interface.parseLog(log);
      if (parsedLog.name === 'IncreaseLiquidity') {
        increaseLiquidityEvent = parsedLog;
        break;
      }
    } catch (e) {
      // Ignore
    }
  }
  
  if (!increaseLiquidityEvent) {
    throw new Error("IncreaseLiquidity event not found");
  }
  
  const tokenId = increaseLiquidityEvent.args.tokenId;
  const mintedLiquidity = increaseLiquidityEvent.args.liquidity;
  console.log("Token ID:", tokenId.toString(), "Minted Liquidity:", mintedLiquidity.toString());

  // 5. Remove liquidity
  const positionInfo = await positionManager.positions(tokenId);
  // Indices: 0: nonce, 1: operator, 2: token0, 3: token1, 4: fee, 5: tickLower, 6: tickUpper, 7: liquidity, 8: feeGrowth0, 9: feeGrowth1, 10: tokensOwed0, 11: tokensOwed1
  console.log("Position info before decrease - Liquidity:", positionInfo[7].toString(), "Owed0:", positionInfo[10].toString(), "Owed1:", positionInfo[11].toString());

  const decreaseParams = {
    tokenId,
    liquidity: mintedLiquidity.div(2), // Remove half
    amount0Min: 0,
    amount1Min: 0,
    deadline: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  const decreaseTx = await positionManager.decreaseLiquidity(decreaseParams, { gasLimit: 8000000 });
  await decreaseTx.wait();
  console.log("Liquidity removed, hash:", decreaseTx.hash);

  // 6. Swap
  console.log("Preparing swaps...");
  const router = await ethers.getContractAt("UnitFlowV3Router", ROUTER_ADDRESS);

  // Scaled swap amounts
  const swapAmountInUSDC = ethers.utils.parseUnits("1", usdcDecimals);
  const swapAmountInMTK = ethers.utils.parseUnits("1", mtkDecimals);

  const swapParams = {
    tokenIn: USDC_ADDRESS,
    tokenOut: MOCK_ADDRESS,
    fee,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 60,
    amountIn: swapAmountInUSDC,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };
  const swapTx = await router.exactInputSingle(swapParams, { gasLimit: 8000000 });
  await swapTx.wait();
  console.log("Swap (USDC -> Mock) hash:", swapTx.hash);

  const swapBackParams = {
    tokenIn: MOCK_ADDRESS,
    tokenOut: USDC_ADDRESS,
    fee,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 60,
    amountIn: swapAmountInMTK,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };
  const swapBackTx = await router.exactInputSingle(swapBackParams, { gasLimit: 8000000 });
  await swapBackTx.wait();
  console.log("Swap (Mock -> USDC) hash:", swapBackTx.hash);

  console.log("Comprehensive test completed successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
