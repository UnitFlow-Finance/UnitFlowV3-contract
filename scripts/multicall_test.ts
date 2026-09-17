import { ethers } from "hardhat";

const ROUTER_ADDRESS = "0x062072529C263d6a2F780c71E39be65FC4e84A90";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const WUSDC_ADDRESS = "0x0Ba5B8B53e15126A4dB99510f97FD92414c85eEe"; // The WUSDC wrapper address

async function main() {
  const [deployer] = await ethers.getSigners();
  const router = await ethers.getContractAt("UnitFlowV3Router", ROUTER_ADDRESS);
  const wusdc = await ethers.getContractAt("IWUSDC", WUSDC_ADDRESS);

  const swapValue = ethers.utils.parseEther("0.01");

  // 1. Encode deposit()
  const depositData = wusdc.interface.encodeFunctionData("deposit", []);

  // 2. Encode exactInputSingle
  // Need to approve the router to spend the newly wrapped WUSDC, 
  // but WUSDC is not yet wrapped, and approval needs to happen 
  // *after* deposit or as a separate step.
  // Standard Multicall approach for this is complex.
  
  console.log("Multicall native-to-ERC20 swap framework requires precise multicall setup.");
}

main();
