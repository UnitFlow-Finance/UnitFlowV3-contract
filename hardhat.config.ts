import "dotenv/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomicfoundation/hardhat-verify";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";

const LOW_OPTIMIZER_SETTINGS = {
  version: "0.7.6",
  settings: {
    evmVersion: "istanbul",
    optimizer: {
      enabled: true,
      runs: 2_000,
    },
    metadata: {
      bytecodeHash: "none" as const,
    },
  },
};

const LOWEST_OPTIMIZER_SETTINGS = {
  version: "0.7.6",
  settings: {
    evmVersion: "istanbul",
    optimizer: {
      enabled: true,
      runs: 1_000,
    },
    metadata: {
      bytecodeHash: "none" as const,
    },
  },
};

// Reduced runs to keep PositionManager under the 24576-byte EIP-170 contract size limit
// after the caller-lock security fix added ~1.2 kB of bytecode.
const POSITION_MANAGER_OPTIMIZER_SETTINGS = {
  version: "0.7.6",
  settings: {
    evmVersion: "istanbul",
    optimizer: {
      enabled: true,
      runs: 200,
    },
    metadata: {
      bytecodeHash: "none" as const,
    },
  },
};

const DEFAULT_COMPILER_SETTINGS = {
  version: "0.7.6",
  settings: {
    evmVersion: "istanbul",
    optimizer: {
      enabled: true,
      runs: 800,
    },
    metadata: {
      bytecodeHash: "none" as const,
    },
  },
};

export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },
    arcTestnet: {
      url: "https://arc-testnet.g.alchemy.com/v2/alch_O1nO5831CiNrf1ErDbkGq",
      chainId: 5042002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    arcMainnet: {
      url: "https://rpc.mainnet.arc.io",
      chainId: 5042,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  solidity: {
    compilers: [DEFAULT_COMPILER_SETTINGS],
    overrides: {
      "contracts/periphery/UnitFlowV3PositionManager.sol": POSITION_MANAGER_OPTIMIZER_SETTINGS,
      "contracts/periphery/NonfungibleTokenPositionDescriptor.sol": LOWEST_OPTIMIZER_SETTINGS,
      "contracts/periphery/libraries/NFTDescriptor.sol": LOWEST_OPTIMIZER_SETTINGS,
    },
  },
  etherscan: {
    apiKey: {
      arcMainnet: process.env.ARC_API_KEY
    },
    customChains: [
     {
        network: "arcTestnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app",
        },
      },
      {
        network: "arcMainnet",
        chainId: 5042,
        urls: {
          apiURL: "https://api.blockscout.com/5042/api",
          browserURL: "https://explorer.arc.io",
        },
      },
    ],
  },
};
