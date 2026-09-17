# UnitFlow V3 Contracts

UnitFlow V3 DEX contracts for Arc Testnet. Forked from Uniswap V3, using native Arc USDC.

## Deployed Addresses (Arc Testnet - Chain ID: 5042002)

| Contract | Address |
|---|---|
| UnitFlowV3Factory | `0xb0bCabE107e9e37b34900667fa4ded4Df7e910CB` |
| UnitFlowInterfaceMulticall | `0x2809EEf218d7ce419C2678a4D488cbEADa405f15` |
| TickLens | `0x66796A4B30f48Cec0F644843fdb6817f1a870a65` |
| NFTDescriptor | `0x0DDf4fb5f1F40b783D84939c6a0694A708E68c7B` |
| NonfungibleTokenPositionDescriptor | `0xAC6C554E2E4957bd89C23ba7A36133e855d0B343` |
| UnitFlowV3PositionManager | `0xf8ecf496D9c31Cbf2aEa4DEc32471851A5c95181` |
| UnitFlowV3Router | `0x75eDe46A468Eb600C10982e6FdCeADCB37a40930` |
| Quoter | `0x09ea20bC7Fbb42C202b2Fa108365ccB15165Dc53` |
| V3Migrator | `0x20ddF7e7E79Cf59DD836B1C2966C12889817CAc0` |

**USDC Address (Canonical):** `0x3600000000000000000000000000000000000000`

**LP NFT:** Name = "UnitFlow V3 Position", Symbol = "UFFV3"

## Project Structure

```
contracts/
  core/           # UnitFlowV3Factory, UnitFlowV3Pool, UnitFlowV3PoolDeployer
  periphery/      # UnitFlowV3PositionManager, UnitFlowV3Router, Quoter, etc.
scripts/
  deploy.ts       # Automated deployment script
```

## Key Changes from Uniswap V3

- All contract names rebranded: `UniswapV3*` → `UnitFlowV3*`
- WETH9 replaced with native Arc USDC everywhere (variables, constructors, interfaces). Wrapping/unwrapping is removed.
- LP NFT: "UnitFlow V3 Position" / "UFFV3"
- Callback functions: `uniswapV3*Callback` → `unitFlowV3*Callback`
- POOL_INIT_CODE_HASH updated for rebranded pool bytecode

## Build & Deploy

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network arcTestnet
```

Set `DEPLOYER_PRIVATE_KEY` env var to override the default deployer key.

## Arc Testnet Config

- RPC: `https://rpc.testnet.arc.network`
- Chain ID: `5042002`
