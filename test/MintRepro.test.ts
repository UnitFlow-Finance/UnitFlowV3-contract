import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

describe("Mint Repro", function () {
  it("should replicate the mint revert", async function () {
    const [deployer] = await ethers.getSigners();

    // 1. Deploy Factory, PoolDeployer, and MockERC20s
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token0 = await MockERC20.deploy("T0", "T0", ethers.utils.parseEther("1000000"));
    const token1 = await MockERC20.deploy("T1", "T1", ethers.utils.parseEther("1000000"));
    
    const Factory = await ethers.getContractFactory("UnitFlowV3Factory");
    const factory = await Factory.deploy();
    
    // Deploy Periphery dependencies
    const PositionManager = await ethers.getContractFactory("UnitFlowV3PositionManager");
    const positionManager = await PositionManager.deploy(factory.address, token0.address, ethers.constants.AddressZero);

    // 2. Create and initialize Pool
    const fee = 3000;
    await factory.createPool(token0.address, token1.address, fee);
    const poolAddress = await factory.getPool(token0.address, token1.address, fee);
    const pool = await ethers.getContractAt("UnitFlowV3Pool", poolAddress);
    await pool.initialize("79228162514264337593543950336");

    // 3. Approve and Mint
    await token0.approve(positionManager.address, ethers.utils.parseEther("1000"));
    await token1.approve(positionManager.address, ethers.utils.parseEther("1000"));

    const mintParams = {
      token0: token0.address,
      token1: token1.address,
      fee,
      tickLower: -60000,
      tickUpper: 60000,
      amount0Desired: ethers.utils.parseEther("100"),
      amount1Desired: ethers.utils.parseEther("100"),
      amount0Min: 0,
      amount1Min: 0,
      recipient: deployer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 60,
    };

    await expect(positionManager.mint(mintParams)).to.not.be.reverted;
  });
});
