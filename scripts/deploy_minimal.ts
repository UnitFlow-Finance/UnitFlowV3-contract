import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying UnitFlowV3Factory with account:", deployer.address);

  const Factory = await ethers.getContractFactory("UnitFlowV3Factory");
  const factory = await Factory.deploy();
  await factory.deployed();

  console.log("UnitFlowV3Factory deployed to:", factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
