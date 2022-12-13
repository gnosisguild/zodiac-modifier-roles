import { ExecutionOptions, RolePreset } from "../../types"
import { allowCurvePool } from "../helpers/curve"
import { allowErc20Approve } from "../helpers/erc20"
import { allowLido } from "../helpers/lido"
import { allowStakewise } from "../helpers/stakewise/stakewise"
import { staticEqual } from "../helpers/utils"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_RECEIVER_PLACEHOLDER,
} from "../placeholders"

const ZERO = "0x0000000000000000000000000000000000000000"
//Tokens
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const BAL = "0xba100000625a3754423978a60c9317c58a424e3D"
const AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
const stkAAVE = "0x4da27a545c0c5B758a6BA100e3a049001de870f5"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const cUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"
const cUSDCV3 = "0xc3d688B66703497DAA19211EEdff47f25384cdc3"
const cAAVE = "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c"
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const cDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
const stETH = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
const IDLE_wstETH_AA_TRANCHE = "0x2688FC68c4eac90d9E5e1B94776cF14eADe8D877"
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

//AAVE contracts
const AAVE_SPENDER = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9"

//Compound V3 contracts
const COMET_REWARDS = "0x1B0e765F6224C21223AeA2af16c1C46E38885a40"

//Compound V2 contracts
const COMPTROLLER = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b"

//Across contracts
const ACROSS_HUB = "0xc186fA914353c44b2E33eBE05f21846F1048bEda"

//Idle contracts
const IDLE_stETH_CDO = "0x34dCd573C5dE4672C8248cd12A99f875Ca112Ad8"
const IDLE_wstETH_AA_GAUGE = "0x675eC042325535F6e176638Dd2d4994F645502B9"
const IDLE_DISTRIBUTOR_PROXY = "0x074306bc6a6fc1bd02b425dd41d742adf36ca9c6"

//Uniswap V3 contracts
const UV3_NFT_POSITIONS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

const preset: RolePreset = {
  network: 1,
  allow: [
    //LIDO
    ...allowLido(),

    //---------------------------------------------------------------------------------------------------------------------------------
    //Staking of AAVE in Safety Module
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([AAVE], [stkAAVE]),
    {
      targetAddress: stkAAVE,
      signature: "stake(address,uint256)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    {
      targetAddress: stkAAVE,
      signature: "claimRewards(address,uint256)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //Initiates 10 days cooldown, till the 2 days unstaking window opens
    {
      targetAddress: stkAAVE,
      signature: "cooldown()",
    },

    //Unstakes, can only be called during the 2 days window after the 10 days cooldown
    {
      targetAddress: stkAAVE,
      signature: "redeem(address,uint256)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([USDC], [cUSDC]),
    //Deposit
    {
      targetAddress: cUSDC,
      signature: "mint(uint256)",
    },
    //Withdrawing: sender redeems uint256 cTokens
    {
      targetAddress: cUSDC,
      signature: "redeem(uint256)",
    },
    //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256)
    {
      targetAddress: cUSDC,
      signature: "redeemUnderlying(uint256)",
    },
    //Claiming of rewards
    {
      targetAddress: COMPTROLLER,
      signature: "claimComp(address,address[])",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [1]: staticEqual(cUSDC, "address"),
      },
    },

    //We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - DAI
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([DAI], [cDAI]),
    //Deposit
    {
      targetAddress: cDAI,
      signature: "mint(uint256)",
    },
    //Withdrawing: sender redeems uint256 cTokens
    {
      targetAddress: cDAI,
      signature: "redeem(uint256)",
    },
    //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256)
    {
      targetAddress: cDAI,
      signature: "redeemUnderlying(uint256)",
    },
    //Claiming of rewards UNCOMMENT LATER!
    {
      targetAddress: COMPTROLLER,
      signature: "claimComp(address,address[])",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [1]: staticEqual(cDAI, "address"),
      },
    },
    //We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - AAVE
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([AAVE], [cAAVE]),
    //Deposit
    {
      targetAddress: cAAVE,
      signature: "mint(uint256)",
    },
    //Withdrawing: sender redeems uint256 cTokens
    {
      targetAddress: cAAVE,
      signature: "redeem(uint256)",
    },
    //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256)
    {
      targetAddress: cAAVE,
      signature: "redeemUnderlying(uint256)",
    },
    //Claiming of rewards
    {
      targetAddress: COMPTROLLER,
      signature: "claimComp(address,address[])",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [1]: staticEqual(cAAVE, "address"),
      },
    },
    //We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    //Idle - Deposit stETH and stake it on "Lido - stETH - Senior Tranche"
    //---------------------------------------------------------------------------------------------------------------------------------

    //Depositing
    ...allowErc20Approve([stETH], [IDLE_stETH_CDO]),

    //Deposit in AA tranche
    {
      targetAddress: IDLE_stETH_CDO,
      signature: "depositAA(uint256)",
    },
    //Withdraw from AA tranche
    {
      targetAddress: IDLE_stETH_CDO,
      signature: "withdrawAA(uint256)",
    },

    //Staking
    ...allowErc20Approve([IDLE_wstETH_AA_TRANCHE], [IDLE_wstETH_AA_GAUGE]),
    //Stake in AA gauge
    {
      targetAddress: IDLE_wstETH_AA_GAUGE,
      signature: "deposit(uint256)",
    },
    //Withdraw from AA gauge
    {
      targetAddress: IDLE_wstETH_AA_GAUGE,
      signature: "withdraw(uint256)",
    },
    //Claiming of rewards
    //Claim LIDO
    {
      targetAddress: IDLE_wstETH_AA_GAUGE,
      signature: "claim_rewards()",
    },
    //Claim IDLE
    {
      targetAddress: IDLE_DISTRIBUTOR_PROXY,
      signature: "distribute(address)",
      params: {
        [0]: staticEqual(IDLE_wstETH_AA_GAUGE, "address"),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Uniswap V3 - WBTC + ETH, Range: 11.786 - 15.082. Fee: 0.3%.
    //---------------------------------------------------------------------------------------------------------------------------------

    ...allowErc20Approve([WBTC], [UV3_NFT_POSITIONS]),

    //Add liquidity
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "mint(address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)",
      options: ExecutionOptions.Send,
      params: {
        [0]: staticEqual(WBTC, "address"),
        [1]: staticEqual(WETH, "address"),
        [2]: staticEqual(3000, "uint24"),
        [9]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "refundETH()",
      options: ExecutionOptions.Send,
    },

    //Increase liquidity
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "increaseLiquidity(uint256,uint256,uint256,uint256,uint256,uint256)",
      options: ExecutionOptions.Send,
    },
    //refundETH() is already whitelisted
    //{
    //  targetAddress: UV3_NFT_POSITIONS,
    //  signature: "refundETH()",
    //  options: ExecutionOptions.Send,
    //},

    //Remove liquidity
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "decreaseLiquidity(uint256,uint128,uint256,uint256,uint256)",
    },
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "collect(uint256,address,uint128,uint128)",
      params: {
        [1]: staticEqual(ZERO, "address"),
      },
    },
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "unwrapWETH9(uint256,address)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "sweepToken(address,uint256,address)",
      params: {
        [0]: staticEqual(WBTC, "address"),
      },
    },

    //Unwrapping of WETH
    {
      targetAddress: WETH,
      signature: "withdraw(uint256)",
    },
  ],
}
export default preset
