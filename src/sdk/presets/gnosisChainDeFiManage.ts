import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders";
import { ExecutionOptions, RolePreset } from "../types";

import { allowErc20Approve, functionSighash, staticEqual } from "./utils";

const ERC20_TOKENS = {
  GNO: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
  "Wrapped XDAI": "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
  "USD//C on xDai": "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
  "Tether USD on xDai": "0x4ECaBa5870353805a9F068101A40E0f32ed605C6",
  "Flex Ungovernance Token from Mainnet":
    "0xD87eaA26dCfB0C0A6160cCf8c8a01BEB1C15fB00",
  "Curve DAO Token on xDai": "0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd",
  "SushiSwap LP Token 0": "0x8C0C36c85192204c8d782F763fF5a30f5bA0192F",
  "SushiSwap LP Token 1": "0x6685C047EAB042297e659bFAa7423E94b4A14b9E",
  "SushiSwap LP Token 2": "0xA227c72a4055A9DC949cAE24f54535fe890d3663",
  "SushiSwap LP Token 3": "0x15f9EEdeEBD121FBb238a8A0caE38f4b4A07A585",
  "Symmetric on xDai": "0xC45b3C1c24d5F54E7a2cF288ac668c74Dd507a84",
  "DXswap 0": "0xD7b118271B1B7d26C9e044Fc927CA31DccB22a5a",
  "DXswap 1": "0x5fCA4cBdC182e40aeFBCb91AFBDE7AD8d3Dc18a8",
  "DXswap 2": "0x2613Cb099C12CECb1bd290Fd0eF6833949374165",
  "Curve.fi wxDAI/USDC/USDT": "0x1337BedC9D22ecbe766dF105c9623922A27963EC",
  "Uniswap V2 GNO/WXDAI": "0x321704900D52F44180068cAA73778d5cD60695A6",
};

const DEFI_PROTOCOLS = {
  "SushiSwap UniswapV2Router02": "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
  "Honeyswap UniswapV2Router02": "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77",
  "Swapr DXswapRouter": "0xE43e60736b1cb4a75ad25240E2f9a62Bff65c0C0",
  ElkRouter: "0xe5759714998e8B50A33c7333C04C2d02e5dcE77f",
  "Curve.fi wxDAI/USDC/USDT StableSwap":
    "0x7f90122BF0700F9E7e1F688fe926940E8839F353",
};

const preset: RolePreset = {
  network: 100,
  allowTargets: [
    { targetAddress: DEFI_PROTOCOLS["Curve.fi wxDAI/USDC/USDT StableSwap"] },
  ],
  allowFunctions: [
    allowErc20Approve(
      Object.values(ERC20_TOKENS),
      Object.values(DEFI_PROTOCOLS)
    ),

    /// Uniswap V2 -->
    {
      functionSig: functionSighash(
        "addLiquidity(address,uint256,uint256,uint256,address,uint256)"
      ),
      targetAddresses: [
        DEFI_PROTOCOLS["SushiSwap UniswapV2Router02"],
        DEFI_PROTOCOLS["Honeyswap UniswapV2Router02"],
        DEFI_PROTOCOLS["Swapr DXswapRouter"],
        DEFI_PROTOCOLS.ElkRouter,
      ],
      params: [
        undefined,
        undefined,
        undefined,
        undefined,
        staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure LP tokens are sent to Avatar
      ],
    },
    {
      functionSig: functionSighash(
        "addLiquidityETH(address,address,uint256,uint256,uint256,uint256,address,uint256)"
      ),
      targetAddresses: [
        DEFI_PROTOCOLS["SushiSwap UniswapV2Router02"],
        DEFI_PROTOCOLS["Honeyswap UniswapV2Router02"],
        DEFI_PROTOCOLS["Swapr DXswapRouter"],
        DEFI_PROTOCOLS.ElkRouter,
      ],
      params: [
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure LP tokens are sent to Avatar
      ],
      options: ExecutionOptions.Send,
    },
    {
      functionSig: functionSighash(
        "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)"
      ),
      targetAddresses: [
        DEFI_PROTOCOLS["SushiSwap UniswapV2Router02"],
        DEFI_PROTOCOLS["Honeyswap UniswapV2Router02"],
        DEFI_PROTOCOLS["Swapr DXswapRouter"],
        DEFI_PROTOCOLS.ElkRouter,
      ],
      params: [
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure tokens are sent to Avatar
      ],
    },
    {
      functionSig: functionSighash(
        "removeLiquidityETH(address,uint256,uint256,uint256,address,uint256)"
      ),
      targetAddresses: [
        DEFI_PROTOCOLS["SushiSwap UniswapV2Router02"],
        DEFI_PROTOCOLS["Honeyswap UniswapV2Router02"],
        DEFI_PROTOCOLS["Swapr DXswapRouter"],
        DEFI_PROTOCOLS.ElkRouter,
      ],
      params: [
        undefined,
        undefined,
        undefined,
        undefined,
        staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure tokens are sent to Avatar
      ],
    },
    // <-- Uniswap V2
  ],
};
export default preset;
