import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockERC20 with account:", deployer.address);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy("Mock Token", "MTK", ethers.utils.parseEther("1000000"));
  await mockERC20.deployed();

  console.log("MockERC20 deployed to:", mockERC20.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
