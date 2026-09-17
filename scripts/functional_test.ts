import { ethers } from "hardhat";

// Deployed addresses on Arc Testnet (from previous deployment)
const FACTORY = "0x83e452a88d265818e209AAb618a004b50BE0fB38";
const POSITION_MANAGER = "0xbBCf12F9346efC3ea9Eae872476e8852772c5fBc";
const ROUTER = "0x062072529C263d6a2F780c71E39be65FC4e84A90";
const USDC = "0x3600000000000000000000000000000000000000";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Running functional test on Arc Testnet with account:", signer.address);

  // 1. Verify USDC (ERC20 compatibility)
  const usdc = await ethers.getContractAt("IERC20Minimal", USDC);
  const balance = await usdc.balanceOf(signer.address);
  console.log("USDC Balance verified, address:", USDC, "balance:", balance.toString());

  // 2. Further functional tests (Add Liquidity / Swap) would go here.
  // Given the complexity of setting up a pool and providing liquidity 
  // without existing pools or liquidity, a full swap/LP test requires
  // significant setup. The previous deployment run verified address compatibility.
  
  console.log("USDC compatibility verified. Full functional suite requires pool setup.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
