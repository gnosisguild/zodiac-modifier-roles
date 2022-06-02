import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders";
import { ExecutionOptions, RolePreset } from "../types";

import { SUSHISWAP_MINI_CHEF } from "./addresses";
import {
  allowErc20Approve,
  allowErc20Transfer,
  functionSighash,
  staticEqual,
} from "./utils";

const ERC20_TOKENS = {
  GNO: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
  sGNO: "0xA4eF9Da5BA71Cc0D2e5E877a910A37eC43420445",
  "Wrapped XDAI": "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
  "USD//C on xDai": "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
  COW: "0x177127622c4A00F3d409B75571e12cB3c8973d3c",
  "RAI from Mainnet": "0xd7a28Aa9c470e7e9D8c676BCd5dd2f40c5683afa",
  "Tether USD on xDai": "0x4ECaBa5870353805a9F068101A40E0f32ed605C6",
  "Flex Ungovernance Token from Mainnet":
    "0xD87eaA26dCfB0C0A6160cCf8c8a01BEB1C15fB00",
  "Curve DAO Token on xDai": "0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd",
  "SushiSwap LP Token 0": "0x8C0C36c85192204c8d782F763fF5a30f5bA0192F",
  "SushiSwap LP Token 1": "0x6685C047EAB042297e659bFAa7423E94b4A14b9E",
  "SushiSwap LP Token 2": "0xA227c72a4055A9DC949cAE24f54535fe890d3663",
  "SushiSwap LP Token 3": "0x15f9EEdeEBD121FBb238a8A0caE38f4b4A07A585",
  "SushiSwap LP Token 4": "0xF38c5b39F29600765849cA38712F302b1522C9B8",
  "SushiToken from Ethereum": "0x2995D1317DcD4f0aB89f4AE60F3f020A4F17C7CE",
  "Symmetric on xDai": "0xC45b3C1c24d5F54E7a2cF288ac668c74Dd507a84",
  "DXswap 0": "0xD7b118271B1B7d26C9e044Fc927CA31DccB22a5a",
  "DXswap 1": "0x5fCA4cBdC182e40aeFBCb91AFBDE7AD8d3Dc18a8",
  "DXswap 2": "0x2613Cb099C12CECb1bd290Fd0eF6833949374165",
  "Curve.fi wxDAI/USDC/USDT": "0x1337BedC9D22ecbe766dF105c9623922A27963EC",
  "Uniswap V2 GNO/WXDAI": "0x321704900D52F44180068cAA73778d5cD60695A6",
};

const DEFI_PROTOCOLS = {
  SUSHISWAP_MINI_CHEF,
  "SushiSwap UniswapV2Router02": "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
  "Honeyswap UniswapV2Router02": "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77",
  "Swapr DXswapRouter": "0xE43e60736b1cb4a75ad25240E2f9a62Bff65c0C0",
  "Swapr StakingRewardsDistribution 0":
    "0x89a9a96E29b0c6A08c83F9e76D6553601f215775",
  "Swapr StakingRewardsDistribution 1":
    "0x42430C8517C3c3E8754F1D6c23AF538037452bd7",
  "Swapr StakingRewardsDistribution 2":
    "0xD2430dCF3a4344a6E97216d0A037438Ea958410a",
  ElkRouter: "0xe5759714998e8B50A33c7333C04C2d02e5dcE77f",
  "Curve.fi wxDAI/USDC/USDT StableSwap":
    "0x7f90122BF0700F9E7e1F688fe926940E8839F353",
  "Curve.fi RAIx3CRV": "0x85bA9Dfb4a3E4541420Fc75Be02E2B42042D7e46",
  "Curve.fi sGNO/GNO": "0xBdF4488Dcf7165788D438b62B4C8A333879B7078",
  "1Inch AggregationRouter": "0x1111111254fb6c44bAC0beD2854e76F90643097d",
};

const CURVE = {
  "GNO/CRV RewardGauge Deposit": "0x78CF256256C8089d68Cde634Cf7cDEFb39286470",
  "GNO/CRV ChildChainStreamer": "0x6C09F6727113543Fd061a721da512B7eFCDD0267",
};

const SYNTHETIX = {
  "GNO StakingRewards 0": "0x2C2Ab81Cf235e86374468b387e241DF22459A265",
  "GNO StakingRewards 1": "0x12a3a66720dD925fa93f7C895bC20Ca9560AdFe7",
  "GNO StakingRewards 2": "0x5D13179c5fa40b87D53Ff67ca26245D3D5B2F872",
  "GNO StakingRewards 3": "0xC61bA16e864eFbd06a9fe30Aab39D18B8F63710a",
};

const SYMMETRIC = {
  ProxyRegistry: "0x46AD1cB076f43126B9a89FdC06f3C8FdF3EEe6e5",
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
    {
      targetAddresses: [ERC20_TOKENS["Wrapped XDAI"]],
      functionSig: functionSighash("deposit()"),
      options: ExecutionOptions.Send,
    },
    // Uniswap V2 -->
    {
      functionSig: functionSighash(
        "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)"
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
        undefined,
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
        undefined,
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
        undefined,
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
        undefined,
      ],
    },
    // <-- Uniswap V2

    allowErc20Transfer(
      [ERC20_TOKENS.GNO],
      [
        CURVE["GNO/CRV ChildChainStreamer"],
        SYNTHETIX["GNO StakingRewards 0"],
        SYNTHETIX["GNO StakingRewards 1"],
        SYNTHETIX["GNO StakingRewards 2"],
        SYNTHETIX["GNO StakingRewards 3"],
      ]
    ),

    // SushiSwap -->
    {
      functionSig: functionSighash("deposit(uint256,uint256,address)"),
      targetAddresses: [SUSHISWAP_MINI_CHEF],
      params: [undefined, undefined, staticEqual(AVATAR_ADDRESS_PLACEHOLDER)],
    },
    // <-- SushiSwap

    // Curve -->
    {
      functionSig: functionSighash("deposit(uint256)"),
      targetAddresses: [CURVE["GNO/CRV RewardGauge Deposit"]],
    },
    {
      functionSig: functionSighash("notify_reward_amount(address)"),
      targetAddresses: [CURVE["GNO/CRV ChildChainStreamer"]],
    },
    {
      functionSig: functionSighash("add_liquidity(uint256[2],uint256)"),
      targetAddresses: [
        DEFI_PROTOCOLS["Curve.fi RAIx3CRV"],
        DEFI_PROTOCOLS["Curve.fi sGNO/GNO"],
      ],
    },
    // <-- Curve

    // Symmetric -->
    {
      functionSig: functionSighash("build()"),
      targetAddresses: [SYMMETRIC["ProxyRegistry"]],
    },
    // <-- Symmetric

    // 1inch --> TODO do we want to allow swaps for this role?
    {
      functionSig: functionSighash(
        "swap(address,(address,address,address,address,uint256,uint256,uint256,bytes),bytes)"
      ),
      targetAddresses: [DEFI_PROTOCOLS["1Inch AggregationRouter"]],
    },
    // <-- 1inch

    // Swapr -->
    {
      functionSig: functionSighash("stake(uint256)"),
      targetAddresses: [
        DEFI_PROTOCOLS["Swapr StakingRewardsDistribution 0"],
        DEFI_PROTOCOLS["Swapr StakingRewardsDistribution 1"],
        DEFI_PROTOCOLS["Swapr StakingRewardsDistribution 2"],
      ],
    },
    // <-- Swapr
  ],
};
export default preset;
