import { expect } from "chai";
import { ethers } from "hardhat";

describe("Deployment", function () {
  it("Should deploy the UnitFlowV3Factory", async function () {
    const Factory = await ethers.getContractFactory("UnitFlowV3Factory");
    const factory = await Factory.deploy();
    await factory.deployed();

    expect(factory.address).to.properAddress;
    console.log("Factory deployed at:", factory.address);
  });
});
